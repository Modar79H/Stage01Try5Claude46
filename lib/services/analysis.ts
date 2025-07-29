// lib/services/analysis.ts - Updated for Product Namespaces
import { prisma } from "../prisma";
import { pineconeService } from "./pinecone";
import { openaiService } from "./openai";
import { sleep } from "../utils";
import fs from "fs/promises";
import path from "path";

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
  "smart_competition", // Runs after required analyses are complete
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

          // Get reviews with product-specific context
          let reviews = [];

          // For smart competition analysis, we don't need main product reviews
          // The analysis will be based entirely on competitor data
          if (analysisType !== "smart_competition") {
            reviews = await pineconeService.getReviewsForAnalysis(
              productId,
              analysisType,
              userId,
              product.brand.id,
              this.getOptimalReviewCount(analysisType, product.reviewsCount),
              false,
              undefined,
              product.name,
            );

            if (reviews.length === 0) {
              errors.push(`No reviews found for ${analysisType} analysis`);
              continue;
            }
          }

          // Get competitor reviews if needed
          let competitorReviews = undefined;
          let existingAnalyses = undefined;

          // Special handling for smart competition analysis
          if (analysisType === "smart_competition") {
            // Skip if no competitors
            if (!hasCompetitors) {
              console.log("Skipping smart_competition - no competitors found");
              continue;
            }

            // Get existing analysis results to compare against
            existingAnalyses =
              await this.getExistingAnalysesForComparison(productId);

            // Skip if required analyses are missing
            const requiredAnalyses = [
              "product_description",
              "swot",
              "stp",
              "customer_journey",
            ];
            const missingAnalyses = requiredAnalyses.filter(
              (type) => !existingAnalyses[type],
            );

            if (missingAnalyses.length > 0) {
              console.log(
                `Skipping smart_competition - missing required analyses: ${missingAnalyses.join(", ")}`,
              );
              continue;
            }

            // Run analyses for each competitor
            const competitorAnalyses = await this.runCompetitorAnalyses(
              product,
              userId,
              product.brand.id,
            );

            // Pass competitor analyses to the smart competition analysis
            existingAnalyses.competitorAnalyses = competitorAnalyses;
          }

          // Perform the analysis
          const result = await openaiService.performAnalysis(
            analysisType,
            reviews,
            competitorReviews,
            existingAnalyses,
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

            // Generate persona images for STP analysis
            if (analysisType === "stp" && result.data.stp_analysis) {
              const stpPersonas = result.data.stp_analysis.segmentation
                ?.filter((segment: any) => segment.buyer_persona)
                .map((segment: any) => segment.buyer_persona);

              if (stpPersonas && stpPersonas.length > 0) {
                await this.generateSTPPersonaImages(
                  productId,
                  result.data.stp_analysis,
                );
              }
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
            await sleep(30000); // 30 second delay
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
        this.getOptimalReviewCount(analysisType, product.reviewsCount),
        false,
        undefined,
        product.name,
      );

      if (reviews.length === 0) {
        throw new Error("No reviews found for analysis");
      }

      // Get competitor reviews if needed
      let competitorReviews = undefined;

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

        // Generate persona images for STP analysis when reprocessing
        if (analysisType === "stp" && result.data.stp_analysis) {
          const stpPersonas = result.data.stp_analysis.segmentation
            ?.filter((segment: any) => segment.buyer_persona)
            .map((segment: any) => segment.buyer_persona);

          if (stpPersonas && stpPersonas.length > 0) {
            await this.generateSTPPersonaImages(
              productId,
              result.data.stp_analysis,
            );
          }
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

  private async generateSTPPersonaImages(
    productId: string,
    stpAnalysis: any,
  ): Promise<void> {
    try {
      let updateNeeded = false;

      for (const segment of stpAnalysis.segmentation) {
        if (
          segment.buyer_persona &&
          segment.buyer_persona.demographics &&
          segment.buyer_persona.persona_intro
        ) {
          const persona = segment.buyer_persona;
          const description = `${persona.persona_intro} - ${persona.demographics.age} ${persona.demographics.job_title}`;
          const imageUrl =
            await openaiService.generatePersonaImage(description);

          if (imageUrl) {
            try {
              // Download the image
              const response = await fetch(imageUrl);
              if (!response.ok) throw new Error("Failed to download image");

              const buffer = await response.arrayBuffer();

              // Generate unique filename
              const timestamp = Date.now();
              const segmentIndex = stpAnalysis.segmentation.indexOf(segment);
              const filename = `persona_stp_${productId}_${segmentIndex}_${timestamp}.png`;
              const localPath = `/images/personas/${filename}`;
              const fullPath = path.join(
                process.cwd(),
                "public",
                "images",
                "personas",
                filename,
              );

              // Save the image locally
              await fs.writeFile(fullPath, Buffer.from(buffer));

              // Store local path instead of OpenAI URL
              persona.image_url = localPath;
              updateNeeded = true;
              console.log(`✅ Saved STP persona image locally: ${localPath}`);
            } catch (downloadError) {
              console.error(
                "Error downloading/saving STP persona image:",
                downloadError,
              );
              // Fall back to OpenAI URL if download fails
              persona.image_url = imageUrl;
              updateNeeded = true;
            }
          }
        }
      }

      // Update the STP analysis with local image paths
      if (updateNeeded) {
        await prisma.analysis.update({
          where: {
            productId_type: {
              productId,
              type: "stp",
            },
          },
          data: {
            data: { stp_analysis: stpAnalysis },
          },
        });
      }
    } catch (error) {
      console.error("Error generating STP persona images:", error);
      // Don't throw - images are nice to have but not critical
    }
  }

  private getOptimalReviewCount(
    analysisType: AnalysisType,
    totalReviews: number,
  ): number {
    // Base review counts (minimum for each analysis type)
    const baseReviewCounts = {
      product_description: 50,
      sentiment: 100,
      voice_of_customer: 200,
      four_w_matrix: 80,
      jtbd: 100,
      stp: 150,
      swot: 100,
      customer_journey: 120,
      smart_competition: 200,
      strategic_recommendations: 100,
      rating_analysis: 150,
    };

    const baseCount = baseReviewCounts[analysisType] || 100;

    // Dynamic scaling based on total reviews
    let scaledCount: number;

    if (totalReviews <= 500) {
      // For small datasets, use base count or total reviews, whichever is smaller
      scaledCount = Math.min(baseCount, totalReviews);
    } else if (totalReviews <= 2000) {
      // For medium datasets, use 20-30% of total reviews
      scaledCount = Math.max(baseCount, Math.floor(totalReviews * 0.25));
    } else if (totalReviews <= 10000) {
      // For large datasets, use 10-15% of total reviews
      scaledCount = Math.max(baseCount, Math.floor(totalReviews * 0.12));
    } else {
      // For very large datasets, use 5-10% with a cap
      scaledCount = Math.max(
        baseCount,
        Math.min(
          Math.floor(totalReviews * 0.08),
          2000, // Cap at 2000 to control costs
        ),
      );
    }

    // Special handling for certain analysis types that benefit from more data
    if (
      analysisType === "voice_of_customer" ||
      analysisType === "smart_competition"
    ) {
      // These analyses benefit from larger sample sizes
      scaledCount = Math.min(scaledCount * 1.5, 3000);
    }

    return Math.floor(scaledCount);
  }

  // Get existing analyses needed for smart competition comparison
  private async getExistingAnalysesForComparison(
    productId: string,
  ): Promise<Record<string, any>> {
    const requiredAnalyses = [
      "product_description",
      "swot",
      "stp",
      "customer_journey",
    ];
    const existingAnalyses: Record<string, any> = {};

    for (const analysisType of requiredAnalyses) {
      try {
        const analysis = await prisma.analysis.findUnique({
          where: {
            productId_type: {
              productId,
              type: analysisType as any,
            },
          },
        });

        if (analysis && analysis.status === "completed" && analysis.data) {
          existingAnalyses[analysisType] = analysis.data;
        }
      } catch (error) {
        console.warn(
          `Could not fetch ${analysisType} analysis for comparison:`,
          error,
        );
      }
    }

    return existingAnalyses;
  }

  // New method to run analyses for each competitor
  private async runCompetitorAnalyses(
    product: any,
    userId: string,
    brandId: string,
  ): Promise<Record<string, any>> {
    const competitorAnalyses: Record<string, any> = {};

    console.log(
      `🔍 Starting competitor analyses for ${product.competitors.length} competitors`,
    );

    for (const competitor of product.competitors) {
      const competitorId = competitor.id;
      const competitorName = competitor.name;
      competitorAnalyses[competitorId] = {};

      console.log(
        `📊 Analyzing competitor: ${competitorName} (ID: ${competitorId})`,
      );

      // Get competitor's review count for dynamic scaling
      const competitorReviewCount = await prisma.review.count({
        where: {
          productId: product.id,
          competitorId: competitorId,
        },
      });

      console.log(
        `📈 Competitor ${competitorName} has ${competitorReviewCount} reviews`,
      );

      // Run Product Description analysis for competitor
      try {
        const productDescReviews = await pineconeService.getReviewsForAnalysis(
          product.id,
          "product_description",
          userId,
          brandId,
          this.getOptimalReviewCount(
            "product_description",
            competitorReviewCount,
          ),
          false,
          undefined,
          competitorName,
          competitorId,
        );

        console.log(
          `✅ Found ${productDescReviews.length} product description reviews for ${competitorName}`,
        );

        if (productDescReviews.length > 0) {
          const productDescResult = await openaiService.performAnalysis(
            "product_description",
            productDescReviews,
          );
          if (productDescResult.status === "completed") {
            competitorAnalyses[competitorId].product_description =
              productDescResult.data;
            console.log(
              `✅ Product description analysis completed for ${competitorName}`,
            );
          } else {
            console.log(
              `❌ Product description analysis failed for ${competitorName}: ${productDescResult.error}`,
            );
          }
        } else {
          console.log(
            `⚠️ No product description reviews found for ${competitorName}`,
          );
        }
      } catch (error) {
        console.error(
          `❌ Error in product description analysis for ${competitorName}:`,
          error,
        );
      }

      // Run SWOT analysis (Strengths/Weaknesses only) for competitor
      try {
        const swotReviews = await pineconeService.getReviewsForAnalysis(
          product.id,
          "swot",
          userId,
          brandId,
          this.getOptimalReviewCount("swot", competitorReviewCount),
          false,
          undefined,
          competitorName,
          competitorId,
        );

        console.log(
          `✅ Found ${swotReviews.length} SWOT reviews for ${competitorName}`,
        );

        if (swotReviews.length > 0) {
          const swotResult =
            await openaiService.performCompetitorSWOTAnalysis(swotReviews);
          if (swotResult.status === "completed") {
            competitorAnalyses[competitorId].swot = swotResult.data;
            console.log(`✅ SWOT analysis completed for ${competitorName}`);
          } else {
            console.log(
              `❌ SWOT analysis failed for ${competitorName}: ${swotResult.error}`,
            );
          }
        } else {
          console.log(`⚠️ No SWOT reviews found for ${competitorName}`);
        }
      } catch (error) {
        console.error(
          `❌ Error in SWOT analysis for ${competitorName}:`,
          error,
        );
      }

      // Run Segmentation analysis for competitor
      const segmentationReviews = await pineconeService.getReviewsForAnalysis(
        product.id,
        "stp",
        userId,
        brandId,
        this.getOptimalReviewCount("stp", competitorReviewCount),
        false,
        undefined,
        competitor.name,
        competitorId,
      );

      if (segmentationReviews.length > 0) {
        const segmentationResult = await openaiService.performAnalysis(
          "stp",
          segmentationReviews,
        );
        if (segmentationResult.status === "completed") {
          competitorAnalyses[competitorId].stp = segmentationResult.data;
        }
      }

      // Run Customer Journey analysis for competitor
      const journeyReviews = await pineconeService.getReviewsForAnalysis(
        product.id,
        "customer_journey",
        userId,
        brandId,
        this.getOptimalReviewCount("customer_journey", competitorReviewCount),
        false,
        undefined,
        competitor.name,
        competitorId,
      );

      if (journeyReviews.length > 0) {
        const journeyResult = await openaiService.performAnalysis(
          "customer_journey",
          journeyReviews,
        );
        if (journeyResult.status === "completed") {
          competitorAnalyses[competitorId].customer_journey =
            journeyResult.data;
        }
      }

      // Add competitor metadata
      competitorAnalyses[competitorId].name = competitorName;
      competitorAnalyses[competitorId].id = competitorId;

      console.log(
        `🎯 Completed analyses for ${competitorName}:`,
        Object.keys(competitorAnalyses[competitorId]),
      );
    }

    console.log(
      `🏁 Competitor analyses summary:`,
      Object.keys(competitorAnalyses),
    );
    return competitorAnalyses;
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
