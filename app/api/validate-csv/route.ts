// app/api/validate-csv/route.ts
import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Parse CSV with papaparse
    const fileContent = await file.text();
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      preview: 6, // Only parse first 6 rows for validation
      transformHeader: (header) => header.trim().toLowerCase(),
      transform: (value) => value.trim(),
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json({
        isValid: false,
        errors: parseResult.errors.map(
          (e) => `Parse error: ${e.message} at row ${e.row}`,
        ),
        preview: [],
      });
    }

    if (parseResult.data.length === 0) {
      return NextResponse.json({
        isValid: false,
        errors: ["CSV file must have at least a header row and one data row"],
        preview: [],
      });
    }

    // Get headers from parsed data
    const headers = Object.keys(parseResult.data[0]);

    // Check for review text column (use same logic as csv.ts)
    const reviewTextCandidates = [
      "review",
      "text",
      "comment",
      "feedback",
      "content",
      "message",
      "review_text",
      "reviewtext",
      "customer_review",
      "review_content",
      "body",
    ];

    const hasReviewColumn = reviewTextCandidates.some((candidate) =>
      headers.some((header) => header.includes(candidate)),
    );

    if (!hasReviewColumn) {
      return NextResponse.json({
        isValid: false,
        errors: [
          "CSV must contain a column with review text (e.g., 'review', 'text', 'comment')",
        ],
        preview: [],
      });
    }

    // Create preview from parsed data
    const preview = parseResult.data;

    return NextResponse.json({
      isValid: true,
      errors: [],
      preview,
    });
  } catch (error) {
    console.error("Error validating CSV:", error);
    return NextResponse.json(
      {
        isValid: false,
        errors: ["Failed to validate CSV file"],
        preview: [],
      },
      { status: 500 },
    );
  }
}
