// app/api/products/[productId]/analysis/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analysisService } from "@/lib/services/analysis";

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

    const status = await analysisService.getAnalysisStatus(productId);

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error fetching analysis status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// app/api/products/[productId]/analysis/restart/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = params;
    const { analysisType } = await request.json();

    if (analysisType) {
      // Restart specific analysis
      const result = await analysisService.reprocessAnalysis(
        productId,
        analysisType,
      );
      return NextResponse.json(result);
    } else {
      // Restart all analyses
      analysisService.processAllAnalyses(productId).catch(console.error);
      return NextResponse.json({
        success: true,
        message: "Analysis restart initiated",
      });
    }
  } catch (error) {
    console.error("Error restarting analysis:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
