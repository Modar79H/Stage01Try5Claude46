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

// New interfaces for the three-layer system
export interface AnalysisChunkMetadata {
  brandId: string;
  productId: string;
  analysisType: string;
  section: string;
  chunkIndex: number;
  totalChunks: number;
  tokenCount: number;
  contentPreview: string; // First 100 chars for preview
}

export interface ProductSummaryMetadata {
  brandId: string;
  productId: string;
  productName: string;
  tokenCount: number;
  version: number;
}

export interface RAGQuery {
  query: string;
  filters: {
    analysisTypes?: string[];
    productIds?: string[];
    sections?: string[];
    dateRange?: { start?: string; end?: string };
  };
  limit: number;
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

  // Search for reviews by specific topic (for temporal analysis)
  async searchReviewsByTopic(
    productId: string,
    topic: string,
    userId: string,
    brandId: string,
    limit: number = 1000,
    competitorId?: string,
    productName?: string,
  ): Promise<ReviewMetadata[]> {
    const namespace = this.getProductNamespace(userId, brandId, productId);

    // Create embedding for the topic
    const topicEmbedding = await this.createEmbedding(topic);

    // Build filter
    const filter: any = {
      productId,
      brandId,
    };

    if (competitorId) {
      filter.competitorId = competitorId;
    }

    try {
      // Search for reviews similar to the topic
      const response = await this.index.namespace(namespace).query({
        vector: topicEmbedding,
        topK: limit,
        filter,
        includeMetadata: true,
      });

      if (!response.matches || response.matches.length === 0) {
        console.log(`No reviews found for topic: ${topic}`);
        return [];
      }

      // Filter results to ensure topic relevance
      const topicLower = topic.toLowerCase();
      const topicWords = topicLower.split(/\s+/);

      const relevantReviews = response.matches
        .map((match: any) => match.metadata as ReviewMetadata)
        .filter((review: ReviewMetadata) => {
          const reviewLower = review.text.toLowerCase();
          // Check if any topic word appears in the review
          return topicWords.some((word) => reviewLower.includes(word));
        });

      console.log(
        `Found ${relevantReviews.length} relevant reviews for topic: ${topic}`,
      );
      return relevantReviews;
    } catch (error) {
      console.error(`Error searching reviews for topic ${topic}:`, error);
      return [];
    }
  }

  // Get ALL product reviews for temporal analysis (original approach)
  async getAllProductReviews(
    productId: string,
    userId: string,
    brandId: string,
    limit: number = 2000,
    competitorId?: string,
  ): Promise<ReviewMetadata[]> {
    const namespace = this.getProductNamespace(userId, brandId, productId);

    // Build filter for the specific product
    const filter: any = {
      productId,
      brandId,
    };

    if (competitorId) {
      filter.competitorId = competitorId;
    } else {
      // Only get main product reviews (not competitor reviews)
      filter.competitorId = { $exists: false };
    }

    try {
      // Create a generic embedding for broad retrieval
      // Using a neutral query to get diverse results
      const genericEmbedding = await this.createEmbedding(
        "customer review feedback opinion experience product quality service",
      );

      // Query for all reviews up to the limit
      const response = await this.index.namespace(namespace).query({
        vector: genericEmbedding,
        topK: limit,
        filter,
        includeMetadata: true,
      });

      if (!response.matches || response.matches.length === 0) {
        console.log(`No reviews found for product: ${productId}`);
        return [];
      }

      // Extract all reviews with their metadata
      const allReviews = response.matches
        .map((match: any) => match.metadata as ReviewMetadata)
        .filter((review: ReviewMetadata) => {
          // Basic validation
          return review.text && review.text.length > 0;
        });

      // Sort by date to maintain chronological order
      allReviews.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });

      console.log(
        `Retrieved ${allReviews.length} total reviews for temporal analysis`,
      );
      return allReviews;
    } catch (error) {
      console.error(
        `Error retrieving all reviews for product ${productId}:`,
        error,
      );
      return [];
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
      analysisType, // ✅ Pass analysis type for semantic queries
      productName,
    );

    const scoredReviews = await this.scoreReviewsForAnalysis(
      diversePool,
      analysisType,
      productName,
    );

    return this.selectBalancedReviews(scoredReviews, limit, analysisType);
  }

  // Get diverse pool of reviews with proportional rating distribution and semantic relevance
  private async getDiverseReviewPool(
    productId: string,
    namespace: string,
    poolSize: number,
    includeCompetitors: boolean,
    analysisVersion?: string,
    competitorId?: string,
    analysisType?: string,
    productName?: string,
  ): Promise<ReviewMetadata[]> {
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

    // Create semantic embedding for better review selection
    const queryText = analysisType
      ? this.getAnalysisQueryText(analysisType, productName)
      : "customer product review feedback experience";
    const queryEmbedding = await this.createEmbedding(queryText);

    // Step 1: Get the actual rating distribution
    const ratingCounts: Record<number, number> = {};
    let totalReviews = 0;

    // Query for count of each rating with semantic relevance
    const countPromises = [1, 2, 3, 4, 5].map(async (rating) => {
      const filter = {
        ...baseFilter,
        rating: { $gte: rating - 0.5, $lt: rating + 0.5 },
      };

      const response = await this.index.namespace(namespace).query({
        vector: queryEmbedding, // ✅ Use semantic embedding instead of zero vector
        filter,
        topK: 10000, // Large number to get actual count
        includeMetadata: false,
      });

      const count = response.matches?.length || 0;
      return { rating, count };
    });

    const countResults = await Promise.all(countPromises);
    countResults.forEach(({ rating, count }) => {
      ratingCounts[rating] = count;
      totalReviews += count;
    });

    // If no reviews found, return empty array
    if (totalReviews === 0) {
      console.log(`No reviews found for product ${productId}`);
      return [];
    }

    console.log(`Rating distribution for product ${productId}:`, ratingCounts);
    console.log(
      `Total reviews: ${totalReviews}, Pool size requested: ${poolSize}`,
    );

    // Step 2: For small datasets, just get all reviews with semantic relevance
    if (totalReviews <= poolSize) {
      console.log(
        `Getting all ${totalReviews} reviews (dataset smaller than pool size)`,
      );
      const response = await this.index.namespace(namespace).query({
        vector: queryEmbedding, // ✅ Use semantic embedding
        filter: baseFilter,
        topK: Math.max(totalReviews, 1), // ✅ Ensure minimum 1
        includeMetadata: true,
      });
      return response.matches?.map((match: any) => match.metadata) || [];
    }

    // Step 3: Calculate proportional allocation for larger datasets
    const ratingAllocations: Record<number, number> = {};
    let allocatedTotal = 0;

    // Initial proportional allocation
    for (let rating = 1; rating <= 5; rating++) {
      if (ratingCounts[rating] > 0) {
        const percentage = ratingCounts[rating] / totalReviews;
        const allocation = Math.floor(poolSize * percentage);
        // Don't allocate more than available
        ratingAllocations[rating] = Math.min(allocation, ratingCounts[rating]);
        allocatedTotal += ratingAllocations[rating];
      } else {
        ratingAllocations[rating] = 0;
      }
    }

    // Distribute any remaining slots to ratings with available reviews
    let remaining = poolSize - allocatedTotal;
    if (remaining > 0) {
      // Sort ratings by number of available reviews (descending)
      const sortedRatings = Object.entries(ratingCounts)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([rating]) => parseInt(rating));

      for (const rating of sortedRatings) {
        const available = ratingCounts[rating] - ratingAllocations[rating];
        if (available > 0 && remaining > 0) {
          const additional = Math.min(available, remaining);
          ratingAllocations[rating] += additional;
          remaining -= additional;
        }
      }
    }

    console.log(`Proportional allocation:`, ratingAllocations);

    // Step 4: Query for reviews with proportional allocation and semantic relevance
    const ratingPromises = Object.entries(ratingAllocations).map(
      async ([rating, allocation]) => {
        if (allocation === 0) return []; // ✅ Skip zero allocations

        const filter = {
          ...baseFilter,
          rating: { $gte: parseInt(rating) - 0.5, $lt: parseInt(rating) + 0.5 },
        };

        const response = await this.index.namespace(namespace).query({
          vector: queryEmbedding, // ✅ Use semantic embedding
          filter,
          topK: Math.max(allocation, 1), // ✅ Ensure minimum 1 to prevent API error
          includeMetadata: true,
        });

        return response.matches?.map((match: any) => match.metadata) || [];
      },
    );

    const ratingResults = await Promise.all(ratingPromises);
    const finalPool = ratingResults.flat();

    console.log(`Final pool size: ${finalPool.length} reviews`);
    return finalPool;
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

  // Select reviews maintaining natural rating distribution
  private selectBalancedReviews(
    scoredReviews: (ReviewMetadata & { score: number })[],
    limit: number,
    analysisType: string,
  ): ReviewMetadata[] {
    // For small datasets, return all reviews
    if (scoredReviews.length <= limit) {
      console.log(
        `Returning all ${scoredReviews.length} scored reviews (no artificial limits)`,
      );
      return scoredReviews
        .sort((a, b) => b.score - a.score)
        .map(({ score, ...review }) => review);
    }

    // For larger datasets, select top-scoring reviews up to the limit
    // This maintains the natural rating distribution while selecting the most relevant reviews
    console.log(
      `Selecting top ${limit} reviews from ${scoredReviews.length} scored reviews`,
    );

    // Sort by score (highest first) and take the top 'limit' reviews
    const selected = scoredReviews
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...review }) => review);

    // Log the rating distribution of selected reviews for debugging
    const distribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    selected.forEach((review) => {
      const rating = Math.round(review.rating || 3);
      distribution[rating]++;
    });
    console.log(`Selected reviews rating distribution:`, distribution);

    return selected;
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
          analysisType, // ✅ Pass analysis type for semantic queries
          productName,
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

  // Get diverse pool of competitor reviews with proportional rating distribution
  private async getDiverseCompetitorPool(
    productId: string,
    competitorId: string,
    namespace: string,
    poolSize: number,
    analysisType?: string,
    productName?: string,
  ): Promise<ReviewMetadata[]> {
    // Create semantic embedding for competitor analysis
    const queryText = analysisType
      ? this.getAnalysisQueryText(analysisType, productName)
      : "competitor product review feedback experience";
    const queryEmbedding = await this.createEmbedding(queryText);

    // Use the same proportional distribution logic as main product
    return this.getDiverseReviewPool(
      productId,
      namespace,
      poolSize,
      false, // Don't include other competitors
      undefined, // No analysis version filter
      competitorId, // Specify this competitor
      analysisType,
      productName,
    );
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

  // NEW: Store analysis chunk with enhanced metadata
  async storeAnalysisChunk(
    brandId: string,
    productId: string,
    analysisType: string,
    section: string,
    chunkIndex: number,
    totalChunks: number,
    content: string,
    userId: string
  ): Promise<string> {
    try {
      const pineconeId = uuidv4();
      const embedding = await this.createEmbedding(content);
      
      // Use brand-level namespace for analysis chunks
      const namespace = this.getBrandNamespace(userId, brandId) + "_analyses";

      const metadata: AnalysisChunkMetadata = {
        brandId,
        productId,
        analysisType,
        section,
        chunkIndex,
        totalChunks,
        tokenCount: content.split(/\s+/).length,
        contentPreview: content.substring(0, 100)
      };

      await this.index.namespace(namespace).upsert([
        {
          id: pineconeId,
          values: embedding,
          metadata
        }
      ]);

      return pineconeId;
    } catch (error) {
      console.error("Error storing analysis chunk:", error);
      throw error;
    }
  }

  // NEW: Store product summary with embedding
  async storeProductSummary(
    brandId: string,
    productId: string,
    productName: string,
    summary: string,
    userId: string,
    version: number = 1
  ): Promise<string> {
    try {
      const pineconeId = uuidv4();
      const embedding = await this.createEmbedding(summary);
      
      // Use brand-level namespace for summaries
      const namespace = this.getBrandNamespace(userId, brandId) + "_summaries";

      const metadata: ProductSummaryMetadata = {
        brandId,
        productId,
        productName,
        tokenCount: summary.split(/\s+/).length,
        version
      };

      await this.index.namespace(namespace).upsert([
        {
          id: pineconeId,
          values: embedding,
          metadata
        }
      ]);

      return pineconeId;
    } catch (error) {
      console.error("Error storing product summary:", error);
      throw error;
    }
  }

  // NEW: Smart RAG retrieval with query processing
  async performRAGQuery(
    ragQuery: RAGQuery,
    userId: string,
    brandId: string
  ): Promise<{
    chunks: { content: string; metadata: AnalysisChunkMetadata; score: number }[];
    summaries: { content: string; metadata: ProductSummaryMetadata; score: number }[];
  }> {
    try {
      const queryEmbedding = await this.createEmbedding(ragQuery.query);
      
      // Build filters for chunks
      const chunkFilter: any = { brandId };
      if (ragQuery.filters.analysisTypes?.length) {
        chunkFilter.analysisType = { $in: ragQuery.filters.analysisTypes };
      }
      if (ragQuery.filters.productIds?.length) {
        chunkFilter.productId = { $in: ragQuery.filters.productIds };
      }
      if (ragQuery.filters.sections?.length) {
        chunkFilter.section = { $in: ragQuery.filters.sections };
      }

      // Query analysis chunks
      const chunksNamespace = this.getBrandNamespace(userId, brandId) + "_analyses";
      const chunkResponse = await this.index.namespace(chunksNamespace).query({
        vector: queryEmbedding,
        filter: chunkFilter,
        topK: Math.floor(ragQuery.limit * 0.8), // 80% for chunks
        includeMetadata: true,
        includeValues: false
      });

      // Query product summaries
      const summariesNamespace = this.getBrandNamespace(userId, brandId) + "_summaries";
      const summaryFilter: any = { brandId };
      if (ragQuery.filters.productIds?.length) {
        summaryFilter.productId = { $in: ragQuery.filters.productIds };
      }
      
      const summaryResponse = await this.index.namespace(summariesNamespace).query({
        vector: queryEmbedding,
        filter: summaryFilter,
        topK: Math.floor(ragQuery.limit * 0.2), // 20% for summaries
        includeMetadata: true,
        includeValues: false
      });

      // Format results
      const chunks = chunkResponse.matches?.map((match: any) => ({
        content: match.metadata.contentPreview,
        metadata: match.metadata as AnalysisChunkMetadata,
        score: match.score || 0
      })) || [];

      const summaries = summaryResponse.matches?.map((match: any) => ({
        content: '', // Will be loaded from database
        metadata: match.metadata as ProductSummaryMetadata,
        score: match.score || 0
      })) || [];

      return { chunks, summaries };
    } catch (error) {
      console.error("Error performing RAG query:", error);
      throw error;
    }
  }

  // NEW: Delete brand analysis data
  async deleteBrandAnalysisData(
    userId: string,
    brandId: string
  ): Promise<{ success: boolean; deletedNamespaces: string[] }> {
    try {
      const namespacesToDelete = [
        this.getBrandNamespace(userId, brandId) + "_analyses",
        this.getBrandNamespace(userId, brandId) + "_summaries"
      ];

      const deletedNamespaces: string[] = [];

      for (const namespace of namespacesToDelete) {
        try {
          const namespaceObj = this.index.namespace(namespace);
          await namespaceObj.delete({ deleteAll: true });
          deletedNamespaces.push(namespace);
          console.log(`✅ Deleted namespace: ${namespace}`);
        } catch (error) {
          console.log(`⚠️ Namespace ${namespace} might not exist or already empty`);
        }
      }

      return { success: true, deletedNamespaces };
    } catch (error) {
      console.error("Error deleting brand analysis data:", error);
      throw error;
    }
  }
}

export const pineconeService = new PineconeService();
