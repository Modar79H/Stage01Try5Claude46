// app/api/brands/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const brands = await prisma.brand.findMany({
      where: { userId: session.user.id },
      include: {
        products: {
          include: {
            _count: {
              select: { analyses: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ brands });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Brand name is required" },
        { status: 400 },
      );
    }

    // Check if brand name already exists for this user
    const existingBrand = await prisma.brand.findUnique({
      where: {
        userId_name: {
          userId: session.user.id,
          name,
        },
      },
    });

    if (existingBrand) {
      return NextResponse.json(
        { error: "Brand name already exists" },
        { status: 400 },
      );
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("Error creating brand:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
