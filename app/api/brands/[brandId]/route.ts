// app/api/brands/[brandId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { brandId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandId } = params;

    // Verify brand belongs to user
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: { products: true },
    });

    if (!brand || brand.userId !== session.user.id) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Delete brand and all associated data (cascade will handle products, analyses, etc.)
    await prisma.brand.delete({
      where: { id: brandId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting brand:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        products: {
          include: {
            competitors: true,
            analyses: true,
            _count: {
              select: { analyses: true },
            },
          },
        },
      },
    });

    if (!brand || brand.userId !== session.user.id) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("Error fetching brand:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
