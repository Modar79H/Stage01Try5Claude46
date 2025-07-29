// lib/services/csv.ts
import Papa from "papaparse";

export interface CSVRow {
  [key: string]: string;
}

export interface ProcessedReview {
  text: string;
  rating: number;
  date: Date;
  productVariation?: string;
  metadata: Record<string, any>;
}

export interface CSVProcessingResult {
  reviews: ProcessedReview[];
  totalRows: number;
  validRows: number;
  errors: string[];
}

class CSVProcessingService {
  async processCSV(file: File): Promise<CSVProcessingResult> {
    try {
      const results: ProcessedReview[] = [];
      const errors: string[] = [];

      // Read file content
      const fileContent = await file.text();

      // Parse CSV with papaparse
      const parseResult = Papa.parse<CSVRow>(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        transformHeader: (header) => header.trim(),
        transform: (value) => value.trim(),
      });

      if (parseResult.errors.length > 0) {
        parseResult.errors.forEach((error) => {
          errors.push(`Parse error: ${error.message} at row ${error.row}`);
        });
      }

      if (parseResult.data.length === 0) {
        return {
          reviews: [],
          totalRows: 0,
          validRows: 0,
          errors: ["CSV file must have at least one data row"],
        };
      }

      // Get headers from first row
      const headers = Object.keys(parseResult.data[0]);
      const columnMapping = this.detectColumns(headers);

      // Check for all required columns
      const missingColumns: string[] = [];

      if (!columnMapping.reviewText) {
        missingColumns.push("review text column");
      }
      if (!columnMapping.rating) {
        missingColumns.push("rating column");
      }
      if (!columnMapping.date) {
        missingColumns.push("date column");
      }

      if (missingColumns.length > 0) {
        return {
          reviews: [],
          totalRows: parseResult.data.length,
          validRows: 0,
          errors: [
            `Missing required columns: ${missingColumns.join(", ")}. Please ensure your CSV contains review text, rating, and date columns.`,
          ],
        };
      }

      // Process data rows
      parseResult.data.forEach((row, index) => {
        try {
          const processed = this.processRow(row, columnMapping);
          if (processed) {
            results.push(processed);
          }
        } catch (error) {
          errors.push(
            `Row ${index + 2}: ${error instanceof Error ? error.message : "Processing error"}`,
          );
        }
      });

      return {
        reviews: results,
        totalRows: parseResult.data.length,
        validRows: results.length,
        errors,
      };
    } catch (error) {
      return {
        reviews: [],
        totalRows: 0,
        validRows: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  private detectColumns(headers: string[]): {
    reviewText: string | null;
    rating: string | null;
    date: string | null;
    productVariation: string | null;
  } {
    const lowerHeaders = headers.map((h) => h.toLowerCase());

    // Detect review text column
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

    let reviewText = null;
    for (const candidate of reviewTextCandidates) {
      const index = lowerHeaders.findIndex((h) => h.includes(candidate));
      if (index !== -1) {
        reviewText = headers[index];
        break;
      }
    }

    // If no match found, use column with longest average text (assume first few rows)
    if (!reviewText && headers.length > 0) {
      reviewText = headers[0]; // Fallback to first column
    }

    // Detect rating column
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

    let rating = null;
    for (const candidate of ratingCandidates) {
      const index = lowerHeaders.findIndex((h) => h.includes(candidate));
      if (index !== -1) {
        rating = headers[index];
        break;
      }
    }

    // Detect date column
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

    let date = null;
    for (const candidate of dateCandidates) {
      const index = lowerHeaders.findIndex((h) => h.includes(candidate));
      if (index !== -1) {
        date = headers[index];
        break;
      }
    }

    // Detect product variation columns
    const variationCandidates = [
      "size",
      "color",
      "model",
      "style",
      "variant",
      "type",
      "category",
      "product_type",
      "product_variant",
      "variation",
    ];

    let productVariation = null;
    for (const candidate of variationCandidates) {
      const index = lowerHeaders.findIndex((h) => h.includes(candidate));
      if (index !== -1) {
        productVariation = headers[index];
        break;
      }
    }

    return {
      reviewText,
      rating,
      date,
      productVariation,
    };
  }

  private processRow(
    row: CSVRow,
    columnMapping: ReturnType<typeof this.detectColumns>,
  ): ProcessedReview | null {
    // Check for required fields
    if (!columnMapping.reviewText || !row[columnMapping.reviewText]) {
      throw new Error("Review text is missing");
    }

    if (!columnMapping.rating || !row[columnMapping.rating]) {
      throw new Error("Rating is missing");
    }

    if (!columnMapping.date || !row[columnMapping.date]) {
      throw new Error("Date is missing");
    }

    const text = String(row[columnMapping.reviewText]).trim();
    if (text.length < 5) {
      throw new Error("Review text is too short (minimum 5 characters)");
    }

    // Process rating (required)
    const ratingValue = row[columnMapping.rating];
    const parsedRating = parseFloat(ratingValue);
    if (isNaN(parsedRating)) {
      throw new Error(`Invalid rating value: "${ratingValue}"`);
    }
    const rating = Math.max(1, Math.min(5, parsedRating));

    // Process date (required)
    const dateValue = row[columnMapping.date];
    const parsedDate = new Date(dateValue);
    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid date value: "${dateValue}"`);
    }
    const date = parsedDate;

    // Process product variation (optional)
    let productVariation: string | undefined;
    if (columnMapping.productVariation && row[columnMapping.productVariation]) {
      productVariation = String(row[columnMapping.productVariation]).trim();
    }

    // Collect all other columns as metadata
    const metadata: Record<string, any> = {};
    Object.keys(row).forEach((key) => {
      if (
        key !== columnMapping.reviewText &&
        key !== columnMapping.rating &&
        key !== columnMapping.date &&
        key !== columnMapping.productVariation
      ) {
        metadata[key] = row[key];
      }
    });

    return {
      text,
      rating,
      date,
      productVariation,
      metadata,
    };
  }

  validateCSVStructure(file: File): Promise<{
    isValid: boolean;
    errors: string[];
    preview: CSVRow[];
  }> {
    // This is now handled by the API route
    return Promise.resolve({
      isValid: true,
      errors: [],
      preview: [],
    });
  }
}

export const csvService = new CSVProcessingService();
