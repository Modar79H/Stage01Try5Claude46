import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";
import { v4 as uuidv4 } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const indexName = process.env.PINECONE_INDEX_NAME || "review-analysis";

export interface ReviewData {
  id: string;
  productId: string;
  competitorId?: string;
  text: string;
  rating?: number;
  date?: Date;
  metadata?: Record<string, any>;
}

export interface ReviewMetadata {
  productId: string;
  competitorId?: string;
  rating?: number;
  date?: string;
  text: string;
  analysisTagged: boolean;
  wordCount: number;
  sentimentScore?: number;
}

class PineconeService {
  private index: any;

  constructor() {
    this.index = pinecone.Index(indexName);
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text.replace(/\n/g, " ").substring(0, 8000), // Limit input size
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error creating embedding:", error);
      throw error;
    }
  }

  async storeReview(review: ReviewData): Promise<string> {
    try {
      const pineconeId = uuidv4();
      const embedding = await this.createEmbedding(review.text);

      const metadata: ReviewMetadata = {
        productId: review.productId,
        competitorId: review.competitorId,
        rating: review.rating,
        date: review.date?.toISOString(),
        text: review.text.substring(0, 1000), // Limit text size in metadata
        analysisTagged: false,
        wordCount: review.text.split(" ").length,
      };

      await this.index.upsert([
        {
          id: pineconeId,
          values: embedding,
          metadata,
        },
      ]);

      return pineconeId;
    } catch (error) {
      console.error("Error storing review in Pinecone:", error);
      throw error;
    }
  }

  async storeMultipleReviews(reviews: ReviewData[]): Promise<string[]> {
    const batchSize = 10;
    const pineconeIds: string[] = [];

    for (let i = 0; i < reviews.length; i += batchSize) {
      const batch = reviews.slice(i, i + batchSize);
      const batchPromises = batch.map(async (review) => {
        const pineconeId = uuidv4();
        const embedding = await this.createEmbedding(review.text);

        const metadata: ReviewMetadata = {
          productId: review.productId,
          competitorId: review.competitorId,
          rating: review.rating,
          date: review.date?.toISOString(),
          text: review.text.substring(0, 1000),
          analysisTagged: false,
          wordCount: review.text.split(" ").length,
        };

        return {
          id: pineconeId,
          values: embedding,
          metadata,
        };
      });

      const vectors = await Promise.all(batchPromises);
      await this.index.upsert(vectors);
      pineconeIds.push(...vectors.map((v) => v.id));

      // Rate limiting
      if (i + batchSize < reviews.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return pineconeIds;
  }

  async getReviewsForAnalysis(
    productId: string,
    analysisType: string,
    limit: number = 100,
    includeCompetitors: boolean = false,
  ): Promise<ReviewMetadata[]> {
    try {
      // Create analysis-specific query
      const queryText = this.getAnalysisQueryText(analysisType);
      const queryEmbedding = await this.createEmbedding(queryText);

      // Build filter
      const filter: Record<string, any> = {
        productId: { $eq: productId },
      };

      if (!includeCompetitors) {
        filter.competitorId = { $exists: false };
      }

      const queryResponse = await this.index.query({
        vector: queryEmbedding,
        filter,
        topK: limit,
        includeMetadata: true,
      });

      return queryResponse.matches?.map((match: any) => match.metadata) || [];
    } catch (error) {
      console.error("Error querying reviews from Pinecone:", error);
      throw error;
    }
  }

  async getCompetitorReviews(
    productId: string,
    competitorIds: string[],
    limit: number = 50,
  ): Promise<ReviewMetadata[]> {
    try {
      const filter = {
        productId: { $eq: productId },
        competitorId: { $in: competitorIds },
      };

      const queryResponse = await this.index.query({
        vector: new Array(1536).fill(0), // Dummy vector for metadata-only search
        filter,
        topK: limit,
        includeMetadata: true,
      });

      return queryResponse.matches?.map((match: any) => match.metadata) || [];
    } catch (error) {
      console.error("Error querying competitor reviews:", error);
      throw error;
    }
  }

  async getDiverseReviews(
    productId: string,
    limit: number = 100,
  ): Promise<ReviewMetadata[]> {
    try {
      // Get reviews with diverse ratings
      const ratingQueries = [1, 2, 3, 4, 5].map(async (rating) => {
        const filter = {
          productId: { $eq: productId },
          rating: { $gte: rating - 0.5, $lt: rating + 0.5 },
        };

        const response = await this.index.query({
          vector: new Array(1536).fill(0),
          filter,
          topK: Math.floor(limit / 5),
          includeMetadata: true,
        });

        return response.matches?.map((match: any) => match.metadata) || [];
      });

      const results = await Promise.all(ratingQueries);
      return results.flat();
    } catch (error) {
      console.error("Error getting diverse reviews:", error);
      throw error;
    }
  }

  private getAnalysisQueryText(analysisType: string): string {
    const queries = {
      sentiment:
        "customer satisfaction likes dislikes positive negative feedback opinion",
      personas:
        "customer profile demographics age occupation lifestyle buyer persona who uses",
      voice_of_customer:
        "keywords frequently mentioned terms common phrases customer language",
      four_w_matrix:
        "who uses what for where when buying occasion purpose location timing",
      jtbd: "job to be done functional emotional social needs goals outcomes tasks",
      stp: "market segmentation targeting positioning customer segments demographics psychographics",
      swot: "strengths weaknesses opportunities threats competitive advantages challenges",
      customer_journey:
        "awareness consideration purchase delivery usage experience touchpoints",
      competition:
        "competitor comparison features benefits advantages disadvantages versus",
      product_description:
        "product features specifications attributes characteristics description",
      strategic_recommendations:
        "recommendations strategy improvement opportunities growth",
    };

    return (
      queries[analysisType as keyof typeof queries] ||
      "general product review analysis"
    );
  }

  async deleteProductReviews(productId: string): Promise<void> {
    try {
      // Note: Pinecone doesn't have a direct way to delete by metadata
      // This is a limitation we'll need to work around
      console.log(`Marking product ${productId} reviews for deletion`);
      // In production, you might want to implement a cleanup job
    } catch (error) {
      console.error("Error deleting product reviews:", error);
      throw error;
    }
  }
}

export const pineconeService = new PineconeService();
