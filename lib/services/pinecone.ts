// lib/services/pinecone.ts - Enhanced with Product Namespaces
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
  analysisVersion?: string;
  uploadDate?: Date;
}

export interface ReviewMetadata {
  productId: string;
  brandId: string;
  competitorId?: string;
  rating?: number;
  date?: string;
  text: string;
  analysisTagged: boolean;
  wordCount: number;
  sentimentScore?: number;
  analysisVersion: string;
  uploadDate: string;
  productName?: string;
  brandName?: string;
}

class PineconeService {
  private index: any;

  constructor() {
    this.index = pinecone.Index(indexName);
  }

  // NEW: Product-specific namespace
  private getProductNamespace(
    userId: string,
    brandId: string,
    productId: string,
  ): string {
    return `user_${userId}_brand_${brandId}_product_${productId}`;
  }

  // Legacy: Brand namespace (for backward compatibility)
  private getBrandNamespace(userId: string, brandId: string): string {
    return `user_${userId}_brand_${brandId}`;
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text.replace(/\n/g, " ").substring(0, 8000),
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error creating embedding:", error);
      throw error;
    }
  }

  // ENHANCED: Store with product-specific namespace
  async storeReview(
    review: ReviewData,
    userId: string,
    brandId: string,
    productId: string,
    analysisVersion: string = "v1",
    brandName?: string,
    productName?: string,
  ): Promise<string> {
    try {
      const pineconeId = uuidv4();
      const embedding = await this.createEmbedding(review.text);
      const namespace = this.getProductNamespace(userId, brandId, productId);

      const metadata: ReviewMetadata = {
        productId: review.productId,
        brandId: brandId,
        competitorId: review.competitorId,
        rating: review.rating,
        date: review.date?.toISOString(),
        text: review.text.substring(0, 1000),
        analysisTagged: false,
        wordCount: review.text.split(" ").length,
        analysisVersion: analysisVersion,
        uploadDate: new Date().toISOString(),
        productName: productName,
        brandName: brandName,
      };

      await this.index.namespace(namespace).upsert([
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

  // ENHANCED: Store multiple reviews with product-specific namespace
  async storeMultipleReviews(
    reviews: ReviewData[],
    userId: string,
    brandId: string,
    productId: string,
    analysisVersion: string = "v1",
    brandName?: string,
    productName?: string,
  ): Promise<string[]> {
    console.log(
      `🔧 DEBUG: Starting storeMultipleReviews for product: ${productId}`,
    );
    console.log(`📊 Reviews count: ${reviews.length}`);
    console.log(
      `👤 User: ${userId}, 🏢 Brand: ${brandId}, 📦 Product: ${productId}`,
    );

    const batchSize = 10;
    const pineconeIds: string[] = [];
    const namespace = this.getProductNamespace(userId, brandId, productId);

    console.log(`📁 Product Namespace: ${namespace}`);

    for (let i = 0; i < reviews.length; i += batchSize) {
      const batch = reviews.slice(i, i + batchSize);
      const batchPromises = batch.map(async (review) => {
        const pineconeId = uuidv4();
        const embedding = await this.createEmbedding(review.text);

        const metadata: ReviewMetadata = {
          productId: review.productId,
          brandId: brandId,
          competitorId: review.competitorId,
          rating: review.rating,
          date: review.date?.toISOString(),
          text: review.text.substring(0, 1000),
          analysisTagged: false,
          wordCount: review.text.split(" ").length,
          analysisVersion: analysisVersion,
          uploadDate: new Date().toISOString(),
          productName: productName,
          brandName: brandName,
        };

        return {
          id: pineconeId,
          values: embedding,
          metadata,
        };
      });

      const vectors = await Promise.all(batchPromises);
      console.log(
        `⬆️ Upserting batch ${Math.floor(i / batchSize) + 1} with ${vectors.length} vectors to namespace: ${namespace}`,
      );

      try {
        await this.index.namespace(namespace).upsert(vectors);
        console.log(
          `✅ Batch ${Math.floor(i / batchSize) + 1} upserted successfully (${vectors.length} vectors)`,
        );
        pineconeIds.push(...vectors.map((v) => v.id));
      } catch (upsertError) {
        console.error(
          `❌ Error upserting batch ${Math.floor(i / batchSize) + 1}:`,
          upsertError,
        );
        throw upsertError;
      }

      // Rate limiting
      if (i + batchSize < reviews.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(
      `🎉 storeMultipleReviews completed. Total IDs: ${pineconeIds.length}`,
    );
    return pineconeIds;
  }

  // ENHANCED: Get reviews with product-specific namespace
  async getReviewsForAnalysis(
    productId: string,
    analysisType: string,
    userId: string,
    brandId: string,
    limit: number = 100,
    includeCompetitors: boolean = false,
    analysisVersion?: string,
    productName?: string,
    competitorId?: string,
  ): Promise<ReviewMetadata[]> {
    try {
      const namespace = this.getProductNamespace(userId, brandId, productId);
      return await this.getSmartReviewsForAnalysis(
        productId,
        analysisType,
        namespace,
        limit,
        includeCompetitors,
        analysisVersion,
        productName,
        competitorId,
      );
    } catch (error) {
      console.error("Error querying reviews from Pinecone:", error);
      throw error;
    }
  }

  // Enhanced smart selection method
  private async getSmartReviewsForAnalysis(
    productId: string,
    analysisType: string,
    namespace: string,
    limit: number,
    includeCompetitors: boolean,
    analysisVersion?: string,
    productName?: string,
    competitorId?: string,
  ): Promise<ReviewMetadata[]> {
    const poolSize = Math.min(limit * 3, 500);
    const diversePool = await this.getDiverseReviewPool(
      productId,
      namespace,
      poolSize,
      includeCompetitors,
      analysisVersion,
      competitorId,
    );

    const scoredReviews = await this.scoreReviewsForAnalysis(
      diversePool,
      analysisType,
      productName,
    );

    return this.selectBalancedReviews(scoredReviews, limit, analysisType);
  }

  // Get diverse pool of reviews
  private async getDiverseReviewPool(
    productId: string,
    namespace: string,
    poolSize: number,
    includeCompetitors: boolean,
    analysisVersion?: string,
    competitorId?: string,
  ): Promise<ReviewMetadata[]> {
    const reviewsPerRating = Math.floor(poolSize / 5);
    const baseFilter: Record<string, any> = {
      productId: { $eq: productId },
    };

    if (competitorId) {
      baseFilter.competitorId = { $eq: competitorId };
    } else if (!includeCompetitors) {
      baseFilter.competitorId = { $exists: false };
    }

    if (analysisVersion) {
      baseFilter.analysisVersion = { $eq: analysisVersion };
    }

    const ratingPromises = [1, 2, 3, 4, 5].map(async (rating) => {
      const filter = {
        ...baseFilter,
        rating: { $gte: rating - 0.5, $lt: rating + 0.5 },
      };

      const response = await this.index.namespace(namespace).query({
        vector: new Array(1536).fill(0),
        filter,
        topK: reviewsPerRating,
        includeMetadata: true,
      });

      return response.matches?.map((match: any) => match.metadata) || [];
    });

    const ratingResults = await Promise.all(ratingPromises);
    return ratingResults.flat();
  }

  // Score reviews for analysis
  private async scoreReviewsForAnalysis(
    reviews: ReviewMetadata[],
    analysisType: string,
    productName?: string,
  ): Promise<(ReviewMetadata & { score: number })[]> {
    const queryText = this.getAnalysisQueryText(analysisType, productName);
    const queryEmbedding = await this.createEmbedding(queryText);

    const reviewEmbeddings = await Promise.all(
      reviews.map((review) => this.createEmbedding(review.text)),
    );

    return reviews
      .map((review, index) => {
        let score = 0;

        const similarity = this.cosineSimilarity(
          queryEmbedding,
          reviewEmbeddings[index],
        );
        score += similarity * 100 * 0.4;

        const wordCount = review.text.split(/\s+/).length;
        const lengthScore = this.getLengthScore(wordCount, analysisType);
        score += lengthScore * 0.2;

        const recencyScore = this.getRecencyScore(review.date);
        score += recencyScore * 0.1;

        const ratingScore = this.getRatingRelevanceScore(
          review.rating || 3,
          analysisType,
        );
        score += ratingScore * 0.2;

        const keywordScore = this.getKeywordScore(review.text, analysisType);
        score += keywordScore * 0.1;

        return { ...review, score };
      })
      .sort((a, b) => b.score - a.score);
  }

  // Select balanced reviews
  private selectBalancedReviews(
    scoredReviews: (ReviewMetadata & { score: number })[],
    limit: number,
    analysisType: string,
  ): ReviewMetadata[] {
    const selected: ReviewMetadata[] = [];
    const ratingCounts: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    const minPerRating = Math.floor(limit / 10);
    const maxPerRating = Math.ceil(limit / 3);

    // First pass: ensure minimum diversity
    for (const review of scoredReviews) {
      const rating = Math.round(review.rating || 3);
      if (ratingCounts[rating] < minPerRating && selected.length < limit) {
        selected.push(review);
        ratingCounts[rating]++;
      }
    }

    // Second pass: fill remaining slots
    for (const review of scoredReviews) {
      const rating = Math.round(review.rating || 3);
      if (selected.length >= limit) break;
      if (!selected.includes(review) && ratingCounts[rating] < maxPerRating) {
        selected.push(review);
        ratingCounts[rating]++;
      }
    }

    return selected.map(({ score, ...review }) => review);
  }

  // NEW: Complete product deletion
  async deleteProductCompletely(
    productId: string,
    userId: string,
    brandId: string,
  ): Promise<{ success: boolean; deletedVectors: number; error?: string }> {
    try {
      const namespace = this.getProductNamespace(userId, brandId, productId);

      console.log(`🗑️ Deleting entire namespace: ${namespace}`);

      // Get namespace stats first to know how many vectors we're deleting
      const stats = await this.index.describeIndexStats();
      const namespaceStats = stats.namespaces?.[namespace];
      const vectorCount = namespaceStats?.vectorCount || 0;

      if (vectorCount === 0) {
        console.log(
          `📭 Namespace ${namespace} is already empty or doesn't exist`,
        );
        return { success: true, deletedVectors: 0 };
      }

      // Delete all vectors in the namespace
      // The Pinecone SDK has different methods depending on the version
      try {
        console.log(
          `🔄 Attempting to delete all vectors in namespace: ${namespace}`,
        );

        // Method 1: Try the delete method with deleteAll parameter
        const namespaceObj = this.index.namespace(namespace);
        await namespaceObj.delete({
          deleteAll: true,
        });

        console.log("✅ Delete operation completed successfully");
      } catch (deleteError: any) {
        console.error("First delete attempt failed:", deleteError);

        // Method 2: Try deleteMany if delete doesn't work
        try {
          console.log("Trying deleteMany method...");
          await this.index.namespace(namespace).deleteMany({
            deleteAll: true,
          });
        } catch (deleteManyError: any) {
          console.error("deleteMany failed:", deleteManyError);

          // Method 3: Try deleteAll as last resort
          try {
            console.log("Trying deleteAll method...");
            await this.index.namespace(namespace).deleteAll();
          } catch (deleteAllError: any) {
            console.error("All deletion methods failed:", deleteAllError);
            throw new Error(
              `Failed to delete namespace ${namespace}: ${deleteAllError.message}`,
            );
          }
        }
      }

      console.log(
        `✅ Successfully deleted all vectors in namespace ${namespace} (${vectorCount} vectors)`,
      );

      return {
        success: true,
        deletedVectors: vectorCount,
      };
    } catch (error) {
      console.error("Error deleting product namespace:", error);
      return {
        success: false,
        deletedVectors: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Helper methods (unchanged but included for completeness)
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private getLengthScore(wordCount: number, analysisType: string): number {
    const idealLengths: Record<
      string,
      { min: number; ideal: number; max: number }
    > = {
      sentiment: { min: 20, ideal: 50, max: 150 },
      personas: { min: 30, ideal: 80, max: 200 },
      voice_of_customer: { min: 10, ideal: 40, max: 100 },
      four_w_matrix: { min: 20, ideal: 60, max: 150 },
      jtbd: { min: 30, ideal: 100, max: 300 },
      stp: { min: 25, ideal: 70, max: 200 },
      swot: { min: 40, ideal: 100, max: 250 },
      customer_journey: { min: 40, ideal: 120, max: 300 },
      competition: { min: 30, ideal: 80, max: 200 },
      product_description: { min: 15, ideal: 40, max: 100 },
      strategic_recommendations: { min: 30, ideal: 80, max: 200 },
      rating_analysis: { min: 20, ideal: 50, max: 150 },
    };

    const lengths = idealLengths[analysisType] || {
      min: 20,
      ideal: 60,
      max: 150,
    };

    if (wordCount < lengths.min) return (wordCount / lengths.min) * 50;
    if (wordCount > lengths.max)
      return 100 - ((wordCount - lengths.max) / lengths.max) * 50;
    if (wordCount <= lengths.ideal) {
      return (
        50 + ((wordCount - lengths.min) / (lengths.ideal - lengths.min)) * 50
      );
    }
    return (
      100 - ((wordCount - lengths.ideal) / (lengths.max - lengths.ideal)) * 50
    );
  }

  private getRecencyScore(date?: string): number {
    if (!date) return 50;

    const now = new Date();
    const daysSince =
      (now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSince <= 180) return 100;
    if (daysSince <= 360) return 80;
    if (daysSince <= 720) return 60;
    if (daysSince <= 1095) return 40;
    return 20;
  }

  private getRatingRelevanceScore(
    rating: number,
    analysisType: string,
  ): number {
    const extremePreference = [
      "swot",
      "sentiment",
      "strategic_recommendations",
    ];
    const balancedPreference = [
      "personas",
      "four_w_matrix",
      "stp",
      "rating_analysis",
    ];

    if (extremePreference.includes(analysisType)) {
      if (rating <= 2 || rating >= 4.5) return 100;
      if (rating <= 2.5 || rating >= 4) return 70;
      return 40;
    }

    if (balancedPreference.includes(analysisType)) {
      return 80;
    }

    if (rating <= 2 || rating >= 4.5) return 90;
    return 70;
  }

  private getKeywordScore(text: string, analysisType: string): number {
    const keywords: Record<string, string[]> = {
      sentiment: [
        "love",
        "hate",
        "excellent",
        "terrible",
        "amazing",
        "awful",
        "perfect",
        "horrible",
      ],
      personas: [
        "I am",
        "my age",
        "my job",
        "lifestyle",
        "daily",
        "routine",
        "prefer",
        "always",
      ],
      four_w_matrix: [
        "use it for",
        "when I",
        "where I",
        "because I",
        "during",
        "at home",
        "at work",
      ],
      jtbd: [
        "helps me",
        "allows me",
        "enables",
        "so that I",
        "need to",
        "want to",
        "trying to",
      ],
      competition: [
        "better than",
        "worse than",
        "compared to",
        "alternative",
        "switched from",
        "instead of",
      ],
      smart_competition: [
        "features",
        "includes",
        "specifications",
        "love about",
        "hate about",
        "advantage",
        "disadvantage",
        "wish it had",
        "compared to",
        "better than",
        "worse than",
        "I am",
        "use for",
        "lifestyle",
        "found through",
        "decided because",
        "shipping",
        "unboxing",
        "customer service",
      ],
      rating_analysis: [
        "rated",
        "stars",
        "star",
        "score",
        "because I gave",
        "reason for rating",
        "love",
        "hate",
        "excellent",
        "terrible",
        "amazing",
        "awful",
        "perfect",
        "horrible",
        "disappointed",
        "satisfied",
        "quality",
        "worth",
        "recommend",
      ],
    };

    const relevantKeywords = keywords[analysisType] || [];
    const lowerText = text.toLowerCase();
    let matches = 0;

    for (const keyword of relevantKeywords) {
      if (lowerText.includes(keyword)) matches++;
    }

    return Math.min(matches * 20, 100);
  }

  private getAnalysisQueryText(
    analysisType: string,
    productName?: string,
  ): string {
    const baseQueries = {
      sentiment:
        "customer satisfaction likes dislikes positive negative feedback opinion emotions feelings",
      personas:
        "customer profile demographics age occupation lifestyle buyer persona who uses identity characteristics",
      voice_of_customer:
        "keywords frequently mentioned terms common phrases customer language vocabulary expressions",
      four_w_matrix:
        "who uses what for where when buying occasion purpose location timing context situation environment",
      jtbd: "job to be done functional emotional social needs goals outcomes tasks problems solutions hiring firing",
      stp: "market segmentation targeting positioning customer segments demographics psychographics behaviors",
      swot: "strengths weaknesses opportunities threats competitive advantages challenges problems benefits drawbacks",
      customer_journey:
        "awareness consideration purchase delivery usage experience touchpoints pain points satisfaction stages",
      competition:
        "competitor comparison features benefits advantages disadvantages versus alternative better worse",
      product_description:
        "product features specifications attributes characteristics description quality materials components",
      strategic_recommendations:
        "recommendations strategy improvement opportunities growth suggestions enhancement future",
      rating_analysis:
        "rating quality satisfaction level score evaluation reasons why rated stars because quality assessment customer happiness drivers",
    };

    let query =
      baseQueries[analysisType as keyof typeof baseQueries] ||
      "general product review analysis";

    if (productName) {
      query = `${productName} ${query}`;
    }

    return query;
  }

  // NEW: Get competitor reviews (updated for product namespace)
  async getCompetitorReviews(
    productId: string,
    competitorIds: string[],
    userId: string,
    brandId: string,
    limit: number = 50,
  ): Promise<ReviewMetadata[]> {
    try {
      const namespace = this.getProductNamespace(userId, brandId, productId);

      const filter = {
        productId: { $eq: productId },
        competitorId: { $in: competitorIds },
      };

      const queryResponse = await this.index.namespace(namespace).query({
        vector: new Array(1536).fill(0),
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

  // NEW: Smart retrieval for competitor reviews with analysis-specific optimization
  async getSmartCompetitorReviews(
    productId: string,
    competitorIds: string[],
    analysisType: string,
    userId: string,
    brandId: string,
    limit: number = 100,
    productName?: string,
  ): Promise<ReviewMetadata[]> {
    try {
      const namespace = this.getProductNamespace(userId, brandId, productId);

      // Get diverse pool for each competitor (balanced representation)
      const perCompetitorLimit = Math.ceil((limit * 3) / competitorIds.length);
      const allReviews: ReviewMetadata[] = [];

      for (const competitorId of competitorIds) {
        const competitorPool = await this.getDiverseCompetitorPool(
          productId,
          competitorId,
          namespace,
          perCompetitorLimit,
        );
        allReviews.push(...competitorPool);
      }

      // Score and select best reviews for this analysis type
      const scoredReviews = await this.scoreReviewsForAnalysis(
        allReviews,
        analysisType,
        productName,
      );

      return this.selectBalancedReviews(scoredReviews, limit, analysisType);
    } catch (error) {
      console.error("Error getting smart competitor reviews:", error);
      throw error;
    }
  }

  // Get diverse pool of competitor reviews with rating distribution
  private async getDiverseCompetitorPool(
    productId: string,
    competitorId: string,
    namespace: string,
    poolSize: number,
  ): Promise<ReviewMetadata[]> {
    const reviewsPerRating = Math.floor(poolSize / 5);
    const allReviews: ReviewMetadata[] = [];

    // Get reviews from each rating level for balanced perspective
    for (let rating = 1; rating <= 5; rating++) {
      const filter = {
        productId: { $eq: productId },
        competitorId: { $eq: competitorId },
        rating: { $eq: rating },
      };

      const queryResponse = await this.index.namespace(namespace).query({
        vector: new Array(1536).fill(0),
        filter,
        topK: reviewsPerRating,
        includeMetadata: true,
      });

      const reviews =
        queryResponse.matches?.map((match: any) => match.metadata) || [];
      allReviews.push(...reviews);
    }

    return allReviews;
  }

  // NEW: Get product namespace stats
  async getProductNamespaceStats(
    userId: string,
    brandId: string,
    productId: string,
  ): Promise<{
    vectorCount: number;
    namespaceExists: boolean;
    namespace: string;
  }> {
    try {
      const namespace = this.getProductNamespace(userId, brandId, productId);
      const stats = await this.index.describeIndexStats();
      const namespaceStats = stats.namespaces?.[namespace];

      return {
        vectorCount: namespaceStats?.vectorCount || 0,
        namespaceExists: !!namespaceStats,
        namespace,
      };
    } catch (error) {
      console.error("Error getting product namespace stats:", error);
      return {
        vectorCount: 0,
        namespaceExists: false,
        namespace: this.getProductNamespace(userId, brandId, productId),
      };
    }
  }

  // NEW: List all product namespaces for a brand
  async listBrandProductNamespaces(
    userId: string,
    brandId: string,
  ): Promise<string[]> {
    try {
      const stats = await this.index.describeIndexStats();
      const namespaces = Object.keys(stats.namespaces || {});
      const brandProductPrefix = `user_${userId}_brand_${brandId}_product_`;
      return namespaces.filter((ns) => ns.startsWith(brandProductPrefix));
    } catch (error) {
      console.error("Error listing brand product namespaces:", error);
      return [];
    }
  }
}

export const pineconeService = new PineconeService();
