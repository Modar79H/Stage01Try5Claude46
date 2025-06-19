// app/api/products/[productId]/route.ts - Enhanced with Complete Deletion
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pineconeService } from "@/lib/services/pinecone";

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        competitors: true,
        analyses: true,
      },
    });

    if (!product || product.brand.userId !== session.user.id) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = params;
    const userId = session.user.id;

    // Verify product belongs to user
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        analyses: true,
        competitors: true,
      },
    });

    if (!product || product.brand.userId !== userId) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.log(
      `🗑️ Starting deletion process for product: ${product.name} (${productId})`,
    );

    // Step 1: Delete all vector data from Pinecone (entire product namespace)
    const pineconeResult = await pineconeService.deleteProductCompletely(
      productId,
      userId,
      product.brand.id,
    );

    if (!pineconeResult.success) {
      console.error("Failed to delete Pinecone data:", pineconeResult.error);
      return NextResponse.json(
        {
          error: "Failed to delete vector data",
          details: pineconeResult.error,
        },
        { status: 500 },
      );
    }

    console.log(
      `✅ Deleted ${pineconeResult.deletedVectors} vectors from Pinecone`,
    );

    // Step 2: Delete database records (PostgreSQL handles cascading)
    // This will automatically delete:
    // - All analyses
    // - All competitors
    // - All reviews
    await prisma.product.delete({
      where: { id: productId },
    });

    console.log(
      `✅ Successfully deleted product ${product.name} from database`,
    );

    return NextResponse.json({
      success: true,
      message: `Product "${product.name}" deleted successfully`,
      deletedVectors: pineconeResult.deletedVectors,
      deletedAnalyses: product.analyses.length,
      deletedCompetitors: product.competitors.length,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
