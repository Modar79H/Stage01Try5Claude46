// lib/services/csv.ts

export interface CSVRow {
  [key: string]: string;
}

export interface ProcessedReview {
  text: string;
  rating?: number;
  date?: Date;
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
      const lines = fileContent.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        return {
          reviews: [],
          totalRows: 0,
          validRows: 0,
          errors: ["CSV file must have at least a header row and one data row"],
        };
      }

      // Parse headers
      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/"/g, ""));
      const columnMapping = this.detectColumns(headers);

      if (!columnMapping.reviewText) {
        return {
          reviews: [],
          totalRows: lines.length - 1,
          validRows: 0,
          errors: ["Could not detect review text column"],
        };
      }

      // Process data rows
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i]
            .split(",")
            .map((v) => v.trim().replace(/"/g, ""));
          const row: CSVRow = {};

          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          const processed = this.processRow(row, columnMapping);
          if (processed) {
            results.push(processed);
          }
        } catch (error) {
          errors.push(
            `Row ${i + 1}: ${error instanceof Error ? error.message : "Processing error"}`,
          );
        }
      }

      return {
        reviews: results,
        totalRows: lines.length - 1,
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
    if (!columnMapping.reviewText || !row[columnMapping.reviewText]) {
      return null;
    }

    const text = String(row[columnMapping.reviewText]).trim();
    if (text.length < 5) {
      // Skip very short reviews
      return null;
    }

    let rating: number | undefined;
    if (columnMapping.rating && row[columnMapping.rating]) {
      const ratingValue = row[columnMapping.rating];
      const parsed = parseFloat(ratingValue);
      if (!isNaN(parsed)) {
        rating = Math.max(1, Math.min(5, parsed));
      }
    }

    let date: Date | undefined;
    if (columnMapping.date && row[columnMapping.date]) {
      const dateValue = row[columnMapping.date];
      if (dateValue) {
        const parsed = new Date(dateValue);
        if (!isNaN(parsed.getTime())) {
          date = parsed;
        }
      }
    }

    // Collect all other columns as metadata
    const metadata: Record<string, any> = {};
    Object.keys(row).forEach((key) => {
      if (
        key !== columnMapping.reviewText &&
        key !== columnMapping.rating &&
        key !== columnMapping.date
      ) {
        metadata[key] = row[key];
      }
    });

    return {
      text,
      rating,
      date,
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
