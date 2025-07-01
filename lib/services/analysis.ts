// lib/services/analysis.ts - Updated for Product Namespaces
import { prisma } from "../prisma";
import { pineconeService } from "./pinecone";
import { openaiService } from "./openai";
import { sleep } from "../utils";

export interface AnalysisProgress {
  productId: string;
  currentStep: string;
  progress: number;
  totalSteps: number;
  error?: string;
}

const ANALYSIS_TYPES = [
  "product_description",
  "sentiment",
  "voice_of_customer",
  "rating_analysis",
  "four_w_matrix",
  "jtbd",
  "stp",
  "swot",
  "customer_journey",
  "personas",
  "competition",
  "strategic_recommendations",
] as const;

type AnalysisType = (typeof ANALYSIS_TYPES)[number];

class AnalysisProcessingService {
  private progressCallbacks: Map<string, (progress: AnalysisProgress) => void> =
    new Map();

  onProgress(
    productId: string,
    callback: (progress: AnalysisProgress) => void,
  ) {
    this.progressCallbacks.set(productId, callback);
  }

  private updateProgress(
    productId: string,
    step: string,
    current: number,
    total: number,
    error?: string,
  ) {
    const callback = this.progressCallbacks.get(productId);
    if (callback) {
      callback({
        productId,
        currentStep: step,
        progress: Math.round((current / total) * 100),
        totalSteps: total,
        error,
      });
    }
  }

  async processAllAnalyses(
    productId: string,
    userId: string,
  ): Promise<{
    success: boolean;
    completedAnalyses: string[];
    errors: string[];
  }> {
    const completedAnalyses: string[] = [];
    const errors: string[] = [];

    try {
      // Mark product as processing
      await prisma.product.update({
        where: { id: productId },
        data: { isProcessing: true },
      });

      this.updateProgress(productId, "Initializing", 0, ANALYSIS_TYPES.length);

      // Get product with competitors and verify user ownership
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          competitors: true,
          brand: true,
        },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      // Verify user owns this product
      if (product.brand.userId !== userId) {
        throw new Error("Unauthorized: Product does not belong to user");
      }

      const hasCompetitors = product.competitors.length > 0;
      const analysesToRun = hasCompetitors
        ? ANALYSIS_TYPES
        : ANALYSIS_TYPES.filter((t) => t !== "competition");

      // Process each analysis type
      for (let i = 0; i < analysesToRun.length; i++) {
        const analysisType = analysesToRun[i];

        try {
          this.updateProgress(
            productId,
            `Processing ${analysisType}`,
            i,
            analysesToRun.length,
          );

          // UPDATED: Get reviews with product-specific context
          const reviews = await pineconeService.getReviewsForAnalysis(
            productId,
            analysisType,
            userId,
            product.brand.id,
            this.getOptimalReviewCount(analysisType),
            false,
            undefined,
            product.name,
          );

          if (reviews.length === 0) {
            errors.push(`No reviews found for ${analysisType} analysis`);
            continue;
          }

          // Get competitor reviews if needed
          let competitorReviews = undefined;
          if (analysisType === "competition" && hasCompetitors) {
            const competitorIds = product.competitors.map((c) => c.id);
            competitorReviews = await pineconeService.getCompetitorReviews(
              productId,
              competitorIds,
              userId,
              product.brand.id,
              50,
            );
          }

          // Perform the analysis
          const result = await openaiService.performAnalysis(
            analysisType,
            reviews,
            competitorReviews,
          );

          if (result.status === "completed") {
            // Store the analysis result
            await prisma.analysis.upsert({
              where: {
                productId_type: {
                  productId,
                  type: analysisType,
                },
              },
              update: {
                data: result.data,
                status: "completed",
                error: null,
                updatedAt: new Date(),
              },
              create: {
                productId,
                type: analysisType,
                data: result.data,
                status: "completed",
              },
            });

            completedAnalyses.push(analysisType);

            // Generate persona images if this is personas analysis
            if (analysisType === "personas" && result.data.customer_personas) {
              await this.generatePersonaImages(
                productId,
                result.data.customer_personas,
              );
            }
          } else {
            errors.push(`${analysisType}: ${result.error || "Unknown error"}`);

            // Store failed analysis
            await prisma.analysis.upsert({
              where: {
                productId_type: {
                  productId,
                  type: analysisType,
                },
              },
              update: {
                status: "failed",
                error: result.error,
                updatedAt: new Date(),
              },
              create: {
                productId,
                type: analysisType,
                data: {},
                status: "failed",
                error: result.error,
              },
            });
          }

          // Rate limiting - wait between analyses
          if (i < analysesToRun.length - 1) {
            this.updateProgress(
              productId,
              "Rate limiting...",
              i + 1,
              analysesToRun.length,
            );
            await sleep(15000); // 15 second delay
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          errors.push(`${analysisType}: ${errorMessage}`);
          console.error(`Error processing ${analysisType}:`, error);
        }
      }

      // Mark product as not processing
      await prisma.product.update({
        where: { id: productId },
        data: { isProcessing: false },
      });

      this.updateProgress(
        productId,
        "Completed",
        analysesToRun.length,
        analysesToRun.length,
      );

      return {
        success: completedAnalyses.length > 0,
        completedAnalyses,
        errors,
      };
    } catch (error) {
      // Mark product as not processing
      await prisma.product
        .update({
          where: { id: productId },
          data: { isProcessing: false },
        })
        .catch(console.error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.updateProgress(
        productId,
        "Failed",
        0,
        ANALYSIS_TYPES.length,
        errorMessage,
      );

      return {
        success: false,
        completedAnalyses,
        errors: [errorMessage],
      };
    }
  }

  async reprocessAnalysis(
    productId: string,
    analysisType: AnalysisType,
    userId: string,
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get product with competitors and verify user ownership
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          competitors: true,
          brand: true,
        },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      // Verify user owns this product
      if (product.brand.userId !== userId) {
        throw new Error("Unauthorized: Product does not belong to user");
      }

      // UPDATED: Get reviews with product-specific context
      const reviews = await pineconeService.getReviewsForAnalysis(
        productId,
        analysisType,
        userId,
        product.brand.id,
        this.getOptimalReviewCount(analysisType),
        false,
        undefined,
        product.name,
      );

      if (reviews.length === 0) {
        throw new Error("No reviews found for analysis");
      }

      // Get competitor reviews if needed
      let competitorReviews = undefined;
      if (analysisType === "competition" && product.competitors.length > 0) {
        const competitorIds = product.competitors.map((c) => c.id);
        competitorReviews = await pineconeService.getCompetitorReviews(
          productId,
          competitorIds,
          userId,
          product.brand.id,
          50,
        );
      }

      // Perform the analysis
      const result = await openaiService.performAnalysis(
        analysisType,
        reviews,
        competitorReviews,
      );

      if (result.status === "completed") {
        // Store the analysis result
        await prisma.analysis.upsert({
          where: {
            productId_type: {
              productId,
              type: analysisType,
            },
          },
          update: {
            data: result.data,
            status: "completed",
            error: null,
            updatedAt: new Date(),
          },
          create: {
            productId,
            type: analysisType,
            data: result.data,
            status: "completed",
          },
        });

        // Generate persona images if this is personas analysis
        if (analysisType === "personas" && result.data.customer_personas) {
          await this.generatePersonaImages(
            productId,
            result.data.customer_personas,
          );
        }

        return { success: true };
      } else {
        // Store failed analysis
        await prisma.analysis.upsert({
          where: {
            productId_type: {
              productId,
              type: analysisType,
            },
          },
          update: {
            status: "failed",
            error: result.error,
            updatedAt: new Date(),
          },
          create: {
            productId,
            type: analysisType,
            data: {},
            status: "failed",
            error: result.error,
          },
        });

        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`Error reprocessing ${analysisType}:`, error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async generatePersonaImages(
    productId: string,
    personas: any[],
  ): Promise<void> {
    try {
      for (const persona of personas) {
        if (persona.demographics && persona.persona_intro) {
          const description = `${persona.persona_intro} - ${persona.demographics.age} ${persona.demographics.job_title}`;
          const imageUrl =
            await openaiService.generatePersonaImage(description);

          if (imageUrl) {
            // Store image URL in persona data
            persona.image_url = imageUrl;
          }
        }
      }

      // Update the personas analysis with image URLs
      await prisma.analysis.update({
        where: {
          productId_type: {
            productId,
            type: "personas",
          },
        },
        data: {
          data: { customer_personas: personas },
        },
      });
    } catch (error) {
      console.error("Error generating persona images:", error);
      // Don't throw - images are nice to have but not critical
    }
  }

  private getOptimalReviewCount(analysisType: AnalysisType): number {
    const reviewCounts = {
      product_description: 50,
      sentiment: 100,
      voice_of_customer: 200,
      four_w_matrix: 80,
      jtbd: 100,
      stp: 150,
      swot: 100,
      customer_journey: 120,
      personas: 150,
      competition: 100,
      strategic_recommendations: 100,
    };

    return reviewCounts[analysisType] || 100;
  }

  async getAnalysisStatus(
    productId: string,
    userId: string,
  ): Promise<{
    isProcessing: boolean;
    completedAnalyses: string[];
    failedAnalyses: string[];
    totalAnalyses: number;
    analyses: Array<{
      type: string;
      status: string;
      error?: string | null;
    }>;
    product: {
      isProcessing: boolean;
    };
  }> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        analyses: true,
        competitors: true,
        brand: true,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Verify user owns this product
    if (product.brand.userId !== userId) {
      throw new Error("Unauthorized: Product does not belong to user");
    }

    const hasCompetitors = product.competitors.length > 0;
    const expectedAnalyses = hasCompetitors
      ? ANALYSIS_TYPES
      : ANALYSIS_TYPES.filter((t) => t !== "competition");

    const completedAnalyses = product.analyses
      .filter((a) => a.status === "completed")
      .map((a) => a.type);

    const failedAnalyses = product.analyses
      .filter((a) => a.status === "failed")
      .map((a) => a.type);

    return {
      isProcessing: product.isProcessing,
      completedAnalyses,
      failedAnalyses,
      totalAnalyses: expectedAnalyses.length,
      analyses: product.analyses.map((a) => ({
        type: a.type,
        status: a.status,
        error: a.error,
      })),
      product: {
        isProcessing: product.isProcessing,
      },
    };
  }
}

export const analysisService = new AnalysisProcessingService();
