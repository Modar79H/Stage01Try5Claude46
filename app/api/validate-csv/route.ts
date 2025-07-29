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

    // Check for all required columns
    const missingColumns: string[] = [];

    // Check for review text column
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
      missingColumns.push("review text (e.g., 'review', 'text', 'comment')");
    }

    // Check for rating column
    const ratingCandidates = [
      "rating",
      "score",
      "stars",
      "star",
      "rate",
      "star_rating",
      "customer_rating",
      "product_rating",
    ];

    const hasRatingColumn = ratingCandidates.some((candidate) =>
      headers.some((header) => header.includes(candidate)),
    );

    if (!hasRatingColumn) {
      missingColumns.push("rating (e.g., 'rating', 'stars', 'score')");
    }

    // Check for date column
    const dateCandidates = [
      "date",
      "time",
      "created",
      "posted",
      "timestamp",
      "review_date",
      "created_at",
      "posted_at",
      "date_posted",
    ];

    const hasDateColumn = dateCandidates.some((candidate) =>
      headers.some((header) => header.includes(candidate)),
    );

    if (!hasDateColumn) {
      missingColumns.push("date (e.g., 'date', 'created', 'posted')");
    }

    if (missingColumns.length > 0) {
      return NextResponse.json({
        isValid: false,
        errors: [
          `Missing required columns: ${missingColumns.join(", ")}. Your CSV must contain review text, rating, and date columns.`,
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
