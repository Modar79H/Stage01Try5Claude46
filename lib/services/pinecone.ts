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
  // New fields for versioning
  analysisVersion?: string; // "v1", "v2", "v3"
  uploadDate?: Date;
}

export interface ReviewMetadata {
  productId: string;
  brandId: string; // Added for brand-level context
  competitorId?: string;
  rating?: number;
  date?: string;
  text: string;
  analysisTagged: boolean;
  wordCount: number;
  sentimentScore?: number;
  // New fields for versioning and chatbot context
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

  // Helper method to get brand namespace
  private getBrandNamespace(userId: string, brandId: string): string {
    return `user_${userId}_brand_${brandId}`;
  }

  // Helper method to get user namespace (for backward compatibility)
  private getUserNamespace(userId: string): string {
    return `user_${userId}`;
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

  async storeReview(
    review: ReviewData,
    userId: string,
    brandId: string,
    analysisVersion: string = "v1",
    brandName?: string,
    productName?: string,
  ): Promise<string> {
    try {
      const pineconeId = uuidv4();
      const embedding = await this.createEmbedding(review.text);
      const namespace = this.getBrandNamespace(userId, brandId);

      const metadata: ReviewMetadata = {
        productId: review.productId,
        brandId: brandId,
        competitorId: review.competitorId,
        rating: review.rating,
        date: review.date?.toISOString(),
        text: review.text.substring(0, 1000), // Limit text size in metadata
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

  async storeMultipleReviews(
    reviews: ReviewData[],
    userId: string,
    brandId: string,
    analysisVersion: string = "v1",
    brandName?: string,
    productName?: string,
  ): Promise<string[]> {
    console.log(`🔧 DEBUG: Starting storeMultipleReviews`);
    console.log(`📊 Reviews count: ${reviews.length}`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`🏢 Brand ID: ${brandId}`);

    const batchSize = 10;
    const pineconeIds: string[] = [];
    const namespace = this.getBrandNamespace(userId, brandId);

    console.log(`📁 Namespace: ${namespace}`);
    console.log(
      `🔑 Pinecone API Key exists: ${!!process.env.PINECONE_API_KEY}`,
    );
    console.log(
      `📄 Index name: ${process.env.PINECONE_INDEX_NAME || "review-analysis"}`,
    );

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
        const upsertResult = await this.index
          .namespace(namespace)
          .upsert(vectors);
        console.log(
          `✅ Batch ${Math.floor(i / batchSize) + 1} upserted successfully:`,
          upsertResult,
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

  async getReviewsForAnalysis(
    productId: string,
    analysisType: string,
    userId: string,
    brandId: string,
    limit: number = 100,
    includeCompetitors: boolean = false,
    analysisVersion?: string, // Optional: get specific version
    productName?: string, // Optional: product name for better query
  ): Promise<ReviewMetadata[]> {
    try {
      // Use smart multi-stage selection for better results
      return await this.getSmartReviewsForAnalysis(
        productId,
        analysisType,
        userId,
        brandId,
        limit,
        includeCompetitors,
        analysisVersion,
        productName,
      );
    } catch (error) {
      console.error("Error querying reviews from Pinecone:", error);
      throw error;
    }
  }

  // New smart selection method with multiple improvements
  private async getSmartReviewsForAnalysis(
    productId: string,
    analysisType: string,
    userId: string,
    brandId: string,
    limit: number,
    includeCompetitors: boolean,
    analysisVersion?: string,
    productName?: string,
  ): Promise<ReviewMetadata[]> {
    const namespace = this.getBrandNamespace(userId, brandId);

    // Stage 1: Get a larger pool of diverse reviews
    const poolSize = Math.min(limit * 3, 500); // Get 3x the needed amount, max 500
    const diversePool = await this.getDiverseReviewPool(
      productId,
      namespace,
      poolSize,
      includeCompetitors,
      analysisVersion,
    );

    // Stage 2: Score and rank reviews based on multiple criteria
    const scoredReviews = await this.scoreReviewsForAnalysis(
      diversePool,
      analysisType,
      productName,
    );

    // Stage 3: Select final reviews with balance constraints
    return this.selectBalancedReviews(scoredReviews, limit, analysisType);
  }

  // Get diverse pool of reviews considering rating distribution and recency
  private async getDiverseReviewPool(
    productId: string,
    namespace: string,
    poolSize: number,
    includeCompetitors: boolean,
    analysisVersion?: string,
  ): Promise<ReviewMetadata[]> {
    const reviewsPerRating = Math.floor(poolSize / 5);
    const baseFilter: Record<string, any> = {
      productId: { $eq: productId },
    };

    if (!includeCompetitors) {
      baseFilter.competitorId = { $exists: false };
    }

    if (analysisVersion) {
      baseFilter.analysisVersion = { $eq: analysisVersion };
    }

    // Get reviews from each rating category
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

  // Score reviews based on relevance, length, and analysis-specific criteria
  private async scoreReviewsForAnalysis(
    reviews: ReviewMetadata[],
    analysisType: string,
    productName?: string,
  ): Promise<(ReviewMetadata & { score: number })[]> {
    // Create analysis-specific query
    const queryText = this.getAnalysisQueryText(analysisType, productName);
    const queryEmbedding = await this.createEmbedding(queryText);

    // Get all review embeddings for similarity scoring
    const reviewEmbeddings = await Promise.all(
      reviews.map((review) => this.createEmbedding(review.text)),
    );

    return reviews
      .map((review, index) => {
        let score = 0;

        // 1. Semantic similarity score (0-100)
        const similarity = this.cosineSimilarity(
          queryEmbedding,
          reviewEmbeddings[index],
        );
        score += similarity * 100 * 0.4; // 40% weight

        // 2. Length score - prefer detailed reviews (0-100)
        const wordCount = review.text.split(/\s+/).length;
        const lengthScore = this.getLengthScore(wordCount, analysisType);
        score += lengthScore * 0.2; // 20% weight

        // 3. Recency score - prefer newer reviews (0-100)
        const recencyScore = this.getRecencyScore(review.date);
        score += recencyScore * 0.1; // 10% weight

        // 4. Rating relevance - some analyses benefit from extreme ratings
        const ratingScore = this.getRatingRelevanceScore(
          review.rating || 3,
          analysisType,
        );
        score += ratingScore * 0.2; // 20% weight

        // 5. Keyword boost - bonus for specific keywords
        const keywordScore = this.getKeywordScore(review.text, analysisType);
        score += keywordScore * 0.1; // 10% weight

        return { ...review, score };
      })
      .sort((a, b) => b.score - a.score);
  }

  // Select balanced set of reviews from scored pool
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

    // Minimum reviews per rating (ensure diversity)
    const minPerRating = Math.floor(limit / 10); // At least 10% from each rating
    const maxPerRating = Math.ceil(limit / 3); // At most 33% from any rating

    // First pass: ensure minimum diversity
    for (const review of scoredReviews) {
      const rating = Math.round(review.rating || 3);
      if (ratingCounts[rating] < minPerRating && selected.length < limit) {
        selected.push(review);
        ratingCounts[rating]++;
      }
    }

    // Second pass: fill remaining slots with highest scores
    for (const review of scoredReviews) {
      const rating = Math.round(review.rating || 3);
      if (selected.length >= limit) break;
      if (!selected.includes(review) && ratingCounts[rating] < maxPerRating) {
        selected.push(review);
        ratingCounts[rating]++;
      }
    }

    // Remove the score property before returning
    return selected.map(({ score, ...review }) => review);
  }

  // Helper: Calculate cosine similarity between two vectors
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

  // Helper: Score based on review length for different analyses
  private getLengthScore(wordCount: number, analysisType: string): number {
    // Different analyses prefer different review lengths
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

  // Helper: Score based on review recency
  private getRecencyScore(date?: Date): number {
    if (!date) return 50; // Neutral score if no date

    const now = new Date();
    const daysSince =
      (now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSince <= 180) return 100; // Last 6 months
    if (daysSince <= 360) return 80; // Last year
    if (daysSince <= 720) return 60; // Last 2 years
    if (daysSince <= 1095) return 40; // Last 3 years
    return 20; // Older than 3 years
  }

  // Helper: Score rating relevance for different analyses
  private getRatingRelevanceScore(
    rating: number,
    analysisType: string,
  ): number {
    // Some analyses benefit from extreme ratings
    const extremePreference = [
      "swot",
      "sentiment",
      "strategic_recommendations",
    ];
    const balancedPreference = ["personas", "four_w_matrix", "stp"];

    if (extremePreference.includes(analysisType)) {
      // Prefer very positive or very negative
      if (rating <= 2 || rating >= 4.5) return 100;
      if (rating <= 2.5 || rating >= 4) return 70;
      return 40; // Neutral ratings less valuable
    }

    if (balancedPreference.includes(analysisType)) {
      // All ratings equally valuable
      return 80;
    }

    // Default: slight preference for detailed reviews (often longer at extremes)
    if (rating <= 2 || rating >= 4.5) return 90;
    return 70;
  }

  // Helper: Keyword scoring for analysis-specific terms
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
    };

    const relevantKeywords = keywords[analysisType] || [];
    const lowerText = text.toLowerCase();
    let matches = 0;

    for (const keyword of relevantKeywords) {
      if (lowerText.includes(keyword)) matches++;
    }

    return Math.min(matches * 20, 100); // 20 points per keyword, max 100
  }

  // NEW: Get all reviews for a brand (for Marketing Strategist Chatbot)
  async getAllBrandReviews(
    userId: string,
    brandId: string,
    limit: number = 1000,
    analysisVersion?: string,
  ): Promise<ReviewMetadata[]> {
    try {
      const namespace = this.getBrandNamespace(userId, brandId);

      const filter: Record<string, any> = {
        brandId: { $eq: brandId },
      };

      if (analysisVersion) {
        filter.analysisVersion = { $eq: analysisVersion };
      }

      const queryResponse = await this.index.namespace(namespace).query({
        vector: new Array(1536).fill(0), // Dummy vector for metadata-only search
        filter,
        topK: limit,
        includeMetadata: true,
      });

      return queryResponse.matches?.map((match: any) => match.metadata) || [];
    } catch (error) {
      console.error("Error querying all brand reviews:", error);
      throw error;
    }
  }

  // NEW: Get reviews for persona chatbot (across all products in brand)
  async getPersonaRelevantReviews(
    userId: string,
    brandId: string,
    personaQuery: string,
    limit: number = 200,
  ): Promise<ReviewMetadata[]> {
    try {
      const namespace = this.getBrandNamespace(userId, brandId);
      const queryEmbedding = await this.createEmbedding(personaQuery);

      const filter = {
        brandId: { $eq: brandId },
      };

      const queryResponse = await this.index.namespace(namespace).query({
        vector: queryEmbedding,
        filter,
        topK: limit,
        includeMetadata: true,
      });

      return queryResponse.matches?.map((match: any) => match.metadata) || [];
    } catch (error) {
      console.error("Error querying persona reviews:", error);
      throw error;
    }
  }

  // NEW: Get historical comparison data
  async getHistoricalReviews(
    productId: string,
    userId: string,
    brandId: string,
    versions: string[], // ["v1", "v2", "v3"]
  ): Promise<{ [version: string]: ReviewMetadata[] }> {
    try {
      const namespace = this.getBrandNamespace(userId, brandId);
      const results: { [version: string]: ReviewMetadata[] } = {};

      for (const version of versions) {
        const filter = {
          productId: { $eq: productId },
          analysisVersion: { $eq: version },
        };

        const queryResponse = await this.index.namespace(namespace).query({
          vector: new Array(1536).fill(0),
          filter,
          topK: 500,
          includeMetadata: true,
        });

        results[version] =
          queryResponse.matches?.map((match: any) => match.metadata) || [];
      }

      return results;
    } catch (error) {
      console.error("Error querying historical reviews:", error);
      throw error;
    }
  }

  async getCompetitorReviews(
    productId: string,
    competitorIds: string[],
    userId: string,
    brandId: string,
    limit: number = 50,
  ): Promise<ReviewMetadata[]> {
    try {
      const namespace = this.getBrandNamespace(userId, brandId);

      const filter = {
        productId: { $eq: productId },
        competitorId: { $in: competitorIds },
      };

      const queryResponse = await this.index.namespace(namespace).query({
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
    userId: string,
    brandId: string,
    limit: number = 100,
  ): Promise<ReviewMetadata[]> {
    try {
      const namespace = this.getBrandNamespace(userId, brandId);

      // Get reviews with diverse ratings
      const ratingQueries = [1, 2, 3, 4, 5].map(async (rating) => {
        const filter = {
          productId: { $eq: productId },
          rating: { $gte: rating - 0.5, $lt: rating + 0.5 },
        };

        const response = await this.index.namespace(namespace).query({
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
    };

    let query =
      baseQueries[analysisType as keyof typeof baseQueries] ||
      "general product review analysis";

    // Add product context if available
    if (productName) {
      query = `${productName} ${query}`;
    }

    return query;
  }

  async deleteProductReviews(
    productId: string,
    userId: string,
    brandId: string,
  ): Promise<void> {
    try {
      const namespace = this.getBrandNamespace(userId, brandId);
      console.log(
        `Marking product ${productId} reviews for deletion in namespace ${namespace}`,
      );
      // Note: Pinecone doesn't have a direct way to delete by metadata
      // This is a limitation we'll need to work around
      // In production, you might want to implement a cleanup job
    } catch (error) {
      console.error("Error deleting product reviews:", error);
      throw error;
    }
  }

  // NEW: Get brand namespace stats
  async getBrandNamespaceStats(
    userId: string,
    brandId: string,
  ): Promise<{
    vectorCount: number;
    namespaceExists: boolean;
    productBreakdown: { [productId: string]: number };
    versionBreakdown: { [version: string]: number };
  }> {
    try {
      const namespace = this.getBrandNamespace(userId, brandId);

      const stats = await this.index.describeIndexStats();
      const namespaceStats = stats.namespaces?.[namespace];

      // Get detailed breakdown by querying
      const productBreakdown: { [productId: string]: number } = {};
      const versionBreakdown: { [version: string]: number } = {};

      // This would require additional queries to get detailed breakdowns
      // Implementation depends on your specific needs

      return {
        vectorCount: namespaceStats?.vectorCount || 0,
        namespaceExists: !!namespaceStats,
        productBreakdown,
        versionBreakdown,
      };
    } catch (error) {
      console.error("Error getting brand namespace stats:", error);
      return {
        vectorCount: 0,
        namespaceExists: false,
        productBreakdown: {},
        versionBreakdown: {},
      };
    }
  }

  // NEW: List all brand namespaces for a user
  async listUserBrandNamespaces(userId: string): Promise<string[]> {
    try {
      const stats = await this.index.describeIndexStats();
      const namespaces = Object.keys(stats.namespaces || {});
      const userPrefix = `user_${userId}_brand_`;
      return namespaces.filter((ns) => ns.startsWith(userPrefix));
    } catch (error) {
      console.error("Error listing brand namespaces:", error);
      return [];
    }
  }
}

export const pineconeService = new PineconeService();
