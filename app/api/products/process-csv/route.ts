// app/api/products/process-csv/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enhancedCSVService } from "@/lib/services/csv-enhanced";
import { csvService } from "@/lib/services/csv";
import type { UserConfirmedMapping } from "@/lib/types/csv-variations";
import Papa from "papaparse";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const mapping = JSON.parse(
      formData.get("mapping") as string,
    ) as UserConfirmedMapping;
    const productId = formData.get("productId") as string | null;
    const competitorId = formData.get("competitorId") as string | null;

    if (!file || !mapping) {
      return NextResponse.json(
        { error: "File and mapping are required" },
        { status: 400 },
      );
    }

    // Process CSV with confirmed mapping
    const fileContent = await file.text();
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim(),
    });

    const data = parseResult.data as Record<string, string>[];
    const processedReviews = [];
    const errors: string[] = [];

    // Process each row with the confirmed mapping
    data.forEach((row, index) => {
      try {
        const text = row[mapping.reviewText]?.trim();
        const ratingValue = row[mapping.rating];
        const dateValue = row[mapping.date];

        if (!text || text.length < 5) {
          throw new Error("Review text is too short");
        }

        const rating = Math.max(1, Math.min(5, parseFloat(ratingValue)));
        if (isNaN(rating)) {
          throw new Error("Invalid rating");
        }

        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date");
        }

        // Extract variation information
        let productVariation: string | undefined;
        if (mapping.variationName && row[mapping.variationName]) {
          productVariation = row[mapping.variationName].trim();
        } else if (mapping.variationId && row[mapping.variationId]) {
          productVariation = row[mapping.variationId].trim();
        }

        // Collect metadata
        const metadata: Record<string, any> = {};
        Object.keys(row).forEach((key) => {
          if (
            key !== mapping.reviewText &&
            key !== mapping.rating &&
            key !== mapping.date &&
            key !== mapping.variationId &&
            key !== mapping.variationName
          ) {
            metadata[key] = row[key];
          }
        });

        // Add variation information if provided
        let finalVariationName = productVariation;
        if (productVariation && mapping.variations?.[productVariation]) {
          // Use edited name if provided
          finalVariationName =
            mapping.variations[productVariation].name || productVariation;

          // Add description to metadata if provided
          if (mapping.variations[productVariation].description) {
            metadata.variationDescription =
              mapping.variations[productVariation].description;
          }

          // Add original variation name for reference if it was changed
          if (
            mapping.variations[productVariation].name &&
            mapping.variations[productVariation].name !== productVariation
          ) {
            metadata.originalVariationName = productVariation;
          }
        }

        processedReviews.push({
          text,
          rating,
          date,
          productVariation: finalVariationName,
          metadata,
        });
      } catch (error) {
        errors.push(
          `Row ${index + 2}: ${error instanceof Error ? error.message : "Processing error"}`,
        );
      }
    });

    return NextResponse.json({
      success: true,
      reviews: processedReviews,
      totalRows: data.length,
      validRows: processedReviews.length,
      errors,
    });
  } catch (error) {
    console.error("Error processing CSV:", error);
    return NextResponse.json(
      { error: "Failed to process CSV file" },
      { status: 500 },
    );
  }
}
