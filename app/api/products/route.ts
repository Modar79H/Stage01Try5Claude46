// app/api/products/route.ts - Updated to use product namespaces
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { csvService } from "@/lib/services/csv";
import { enhancedCSVService } from "@/lib/services/csv-enhanced";
import { pineconeService } from "@/lib/services/pinecone";
import { analysisService } from "@/lib/services/analysis";
import type { UserConfirmedMapping } from "@/lib/types/csv-variations";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const brandId = formData.get("brandId") as string;
    const reviewsFile = formData.get("reviewsFile") as File;
    const competitorCount = parseInt(
      (formData.get("competitorCount") as string) || "0",
    );
    const mainProductMapping = formData.get("mainProductMapping") as
      | string
      | null;

    if (!name || !brandId || !reviewsFile) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify brand belongs to user and get brand details
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand || brand.userId !== userId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Check if product name already exists in this brand
    const existingProduct = await prisma.product.findUnique({
      where: {
        brandId_name: {
          brandId,
          name,
        },
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "Product name already exists in this brand" },
        { status: 400 },
      );
    }

    // Process main product CSV file
    let csvResult;
    let detectedVariations:
      | Record<string, { count: number; description?: string }>
      | undefined;

    if (mainProductMapping) {
      // Use enhanced CSV service with confirmed mapping
      const mapping: UserConfirmedMapping = JSON.parse(mainProductMapping);
      const processResult = await enhancedCSVService.processCSVWithMapping(
        reviewsFile,
        mapping,
      );
      csvResult = processResult;
      detectedVariations = processResult.variations;
    } else {
      // Use standard CSV service
      const validation = await csvService.validateCSVStructure(reviewsFile);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: "Invalid CSV file", details: validation.errors },
          { status: 400 },
        );
      }
      csvResult = await csvService.processCSV(reviewsFile);
    }

    if (csvResult.validRows === 0) {
      return NextResponse.json(
        {
          error: "No valid reviews found in CSV file",
          details: csvResult.errors,
        },
        { status: 400 },
      );
    }

    // Process competitor files if any
    const competitors: { name: string; file: File; csvResult: any }[] = [];

    for (let i = 0; i < competitorCount; i++) {
      const competitorName = formData.get(`competitorName_${i}`) as string;
      const competitorFile = formData.get(`competitorFile_${i}`) as File;
      const competitorMapping = formData.get(`competitorMapping_${i}`) as
        | string
        | null;

      if (competitorName && competitorFile) {
        let competitorCsvResult;

        if (competitorMapping) {
          // Use enhanced CSV service with confirmed mapping
          const mapping: UserConfirmedMapping = JSON.parse(competitorMapping);
          competitorCsvResult = await enhancedCSVService.processCSVWithMapping(
            competitorFile,
            mapping,
          );
        } else {
          // Use standard CSV service
          const competitorValidation =
            await csvService.validateCSVStructure(competitorFile);
          if (!competitorValidation.isValid) {
            return NextResponse.json(
              {
                error: `Invalid CSV file for competitor ${competitorName}`,
                details: competitorValidation.errors,
              },
              { status: 400 },
            );
          }
          competitorCsvResult = await csvService.processCSV(competitorFile);
        }

        if (competitorCsvResult.validRows === 0) {
          return NextResponse.json(
            {
              error: `No valid reviews found for competitor ${competitorName}`,
              details: competitorCsvResult.errors,
            },
            { status: 400 },
          );
        }

        competitors.push({
          name: competitorName,
          file: competitorFile,
          csvResult: competitorCsvResult,
        });
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        brandId,
        reviewsFile: reviewsFile.name,
        reviewsCount: csvResult.validRows,
        variations: detectedVariations ? detectedVariations : undefined,
        isProcessing: true,
      },
    });

    // Store main product reviews in Pinecone with NEW product-specific namespace
    const reviewsData = csvResult.reviews.map((review) => ({
      id: "",
      productId: product.id,
      text: review.text,
      rating: review.rating,
      date: review.date,
      productVariation: review.productVariation,
      metadata: review.metadata,
    }));

    console.log(
      `🚀 About to store ${reviewsData.length} reviews in Pinecone for product: ${product.id}`,
    );
    console.log(
      `👤 User: ${userId}, 🏢 Brand: ${brandId} (${brand.name}), 📦 Product: ${product.id}`,
    );

    // Start vectorization timing
    const vectorizationStartTime = Date.now();
    console.log(
      `⏱️ [${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}] Starting vectorization process for ${reviewsData.length} reviews...`,
    );

    let pineconeIds: string[];
    try {
      // UPDATED: Now using product-specific namespace
      pineconeIds = await pineconeService.storeMultipleReviews(
        reviewsData,
        userId,
        brandId,
        product.id, // NEW: Pass product ID for separate namespace
        "v1",
        brand.name,
        name,
      );
      console.log(
        `✅ Successfully stored reviews. Pinecone IDs count: ${pineconeIds.length}`,
      );

      // End vectorization timing
      const vectorizationEndTime = Date.now();
      const vectorizationDuration =
        vectorizationEndTime - vectorizationStartTime;
      console.log(
        `⏱️ [${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}] Vectorization completed in ${(vectorizationDuration / 1000).toFixed(2)} seconds`,
      );
    } catch (pineconeError) {
      console.error(`❌ Error storing reviews in Pinecone:`, pineconeError);

      // Clean up the created product since Pinecone upload failed
      await prisma.product.delete({
        where: { id: product.id },
      });

      return NextResponse.json(
        {
          error:
            "We're having trouble processing your reviews right now. Please try uploading your product again in a few minutes.",
          details: "Our review processing service is temporarily unavailable.",
        },
        { status: 503 },
      );
    }

    // Store review metadata in database
    const reviewRecords = reviewsData.map((review, index) => ({
      productId: product.id,
      originalText: review.text,
      rating: review.rating,
      date: review.date,
      productVariation: review.productVariation,
      metadata: review.metadata,
      pineconeId: pineconeIds[index],
    }));

    await prisma.review.createMany({
      data: reviewRecords,
    });

    // Process competitors if any
    if (competitors.length > 0) {
      for (const competitor of competitors) {
        const competitorRecord = await prisma.competitor.create({
          data: {
            name: competitor.name,
            productId: product.id,
            reviewsFile: competitor.file.name,
            variations: competitor.csvResult.variations
              ? competitor.csvResult.variations
              : undefined,
          },
        });

        const competitorReviewsData = competitor.csvResult.reviews.map(
          (review) => ({
            id: "",
            productId: product.id,
            competitorId: competitorRecord.id,
            text: review.text,
            rating: review.rating,
            date: review.date,
            productVariation: review.productVariation,
            metadata: review.metadata,
          }),
        );

        console.log(
          `🏆 Storing ${competitorReviewsData.length} competitor reviews for: ${competitor.name}`,
        );

        // Start competitor vectorization timing
        const competitorVectorizationStart = Date.now();
        console.log(
          `⏱️ [${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}] Starting vectorization for competitor ${competitor.name} (${competitorReviewsData.length} reviews)...`,
        );

        let competitorPineconeIds: string[];
        try {
          // UPDATED: Now using product-specific namespace for competitors too
          competitorPineconeIds = await pineconeService.storeMultipleReviews(
            competitorReviewsData,
            userId,
            brandId,
            product.id, // NEW: Pass product ID
            "v1",
            brand.name,
            competitor.name,
          );
          console.log(
            `✅ Competitor reviews stored successfully. IDs: ${competitorPineconeIds.length}`,
          );

          // End competitor vectorization timing
          const competitorVectorizationEnd = Date.now();
          const competitorVectorizationDuration =
            competitorVectorizationEnd - competitorVectorizationStart;
          console.log(
            `⏱️ [${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}] Competitor ${competitor.name} vectorization completed in ${(competitorVectorizationDuration / 1000).toFixed(2)} seconds`,
          );
        } catch (competitorPineconeError) {
          console.error(
            `❌ Error storing competitor reviews:`,
            competitorPineconeError,
          );

          // Clean up the created product and competitor since Pinecone upload failed
          await prisma.competitor.delete({
            where: { id: competitorRecord.id },
          });
          await prisma.product.delete({
            where: { id: product.id },
          });

          return NextResponse.json(
            {
              error:
                "We're having trouble processing your competitor reviews right now. Please try uploading your product again in a few minutes.",
              details:
                "Our review processing service is temporarily unavailable.",
            },
            { status: 503 },
          );
        }

        const competitorReviewRecords = competitorReviewsData.map(
          (review, index) => ({
            productId: product.id,
            competitorId: competitorRecord.id,
            originalText: review.text,
            rating: review.rating,
            date: review.date,
            productVariation: review.productVariation,
            metadata: review.metadata,
            pineconeId: competitorPineconeIds[index],
          }),
        );

        await prisma.review.createMany({
          data: competitorReviewRecords,
        });
      }
    }

    // Start analysis processing in background with user context
    analysisService.processAllAnalyses(product.id, userId).catch(console.error);

    return NextResponse.json({
      product,
      message:
        "Product created successfully. Analysis is starting in the background.",
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
