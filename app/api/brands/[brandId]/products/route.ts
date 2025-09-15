import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { brandId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandId } = params;

    // Verify brand ownership
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { userId: true },
    });

    if (!brand || brand.userId !== session.user.id) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Get products for the brand
    const products = await prisma.product.findMany({
      where: { brandId },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Get brand products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
