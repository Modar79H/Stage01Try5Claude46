// app/api/user/timezone/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { timezone } = await request.json();

    if (!timezone) {
      return NextResponse.json(
        { error: "Timezone is required" },
        { status: 400 },
      );
    }

    // Update user timezone
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { timezone },
      select: { id: true, timezone: true },
    });

    return NextResponse.json({
      success: true,
      timezone: updatedUser.timezone,
    });
  } catch (error) {
    console.error("Timezone update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user timezone
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { timezone: true },
    });

    return NextResponse.json({
      timezone: user?.timezone || "UTC",
    });
  } catch (error) {
    console.error("Timezone fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
