// app/api/validate-csv/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Simple validation for server environment
    const fileContent = await file.text();
    const lines = fileContent.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json({
        isValid: false,
        errors: ["CSV file must have at least a header row and one data row"],
        preview: [],
      });
    }

    const headers = lines[0]
      .toLowerCase()
      .split(",")
      .map((h) => h.trim().replace(/"/g, ""));

    // Check for review text column
    const hasReviewColumn = headers.some((header) =>
      ["review", "text", "comment", "feedback", "content"].includes(header),
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

    // Create preview
    const preview = lines.slice(0, 6).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      return row;
    });

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
