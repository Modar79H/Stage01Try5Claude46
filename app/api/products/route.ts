// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { csvService } from "@/lib/services/csv";
import { pineconeService } from "@/lib/services/pinecone";
import { analysisService } from "@/lib/services/analysis";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const brandId = formData.get("brandId") as string;
    const reviewsFile = formData.get("reviewsFile") as File;

    if (!name || !brandId || !reviewsFile) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify brand belongs to user
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand || brand.userId !== session.user.id) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Validate CSV file
    const validation = await csvService.validateCSVStructure(reviewsFile);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Invalid CSV file", details: validation.errors },
        { status: 400 },
      );
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

    // Process CSV file
    const csvResult = await csvService.processCSV(reviewsFile);

    if (csvResult.validRows === 0) {
      return NextResponse.json(
        {
          error: "No valid reviews found in CSV file",
          details: csvResult.errors,
        },
        { status: 400 },
      );
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        brandId,
        reviewsFile: reviewsFile.name,
        reviewsCount: csvResult.validRows,
        isProcessing: true,
      },
    });

    // Store reviews in Pinecone
    const reviewsData = csvResult.reviews.map((review) => ({
      id: "",
      productId: product.id,
      text: review.text,
      rating: review.rating,
      date: review.date,
      metadata: review.metadata,
    }));

    const pineconeIds = await pineconeService.storeMultipleReviews(reviewsData);

    // Store review metadata in database
    const reviewRecords = reviewsData.map((review, index) => ({
      productId: product.id,
      originalText: review.text,
      rating: review.rating,
      date: review.date,
      metadata: review.metadata,
      pineconeId: pineconeIds[index],
    }));

    await prisma.review.createMany({
      data: reviewRecords,
    });

    // Start analysis processing in background
    analysisService.processAllAnalyses(product.id).catch(console.error);

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
