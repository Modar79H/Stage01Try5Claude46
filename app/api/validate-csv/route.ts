// app/api/validate-csv/route.ts
import { NextRequest, NextResponse } from "next/server";
import { enhancedCSVService } from "@/lib/services/csv-enhanced";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Use enhanced CSV service for comprehensive analysis
    const analysisResult = await enhancedCSVService.analyzeCSVStructure(file);

    return NextResponse.json(analysisResult);
  } catch (error) {
    console.error("Error validating CSV:", error);
    return NextResponse.json(
      {
        isValid: false,
        errors: ["Failed to validate CSV file"],
        preview: [],
        detectedColumns: {
          reviewText: null,
          rating: null,
          date: null,
          unmappedColumns: [],
        },
        detectedVariations: [],
        totalRows: 0,
        needsConfirmation: true,
      },
      { status: 500 },
    );
  }
}
