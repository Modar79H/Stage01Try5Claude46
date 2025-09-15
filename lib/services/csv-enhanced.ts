// lib/services/csv-enhanced.ts
import Papa from "papaparse";
import {
  VariationColumn,
  DetectedVariation,
  ColumnMapping,
  CSVValidationResult,
  UserConfirmedMapping,
  SEMANTIC_PATTERNS,
  ID_COLUMN_PATTERNS,
  VARIATION_NAME_PATTERNS,
} from "@/lib/types/csv-variations";

export class EnhancedCSVService {
  async analyzeCSVStructure(file: File): Promise<CSVValidationResult> {
    try {
      // Check file size first (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        return {
          isValid: false,
          errors: ["File size exceeds 50MB limit"],
          preview: [],
          detectedColumns: {
            reviewText: null,
            rating: null,
            date: null,
            unmappedColumns: [],
          },
          detectedVariations: [],
          totalRows: 0,
          needsConfirmation: false,
        };
      }

      const fileContent = await file.text();

      // Parse entire file to get accurate statistics
      const fullParseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        transformHeader: (header) => header.trim(),
        transform: (value) => value.trim(),
      });

      if (fullParseResult.errors.length > 0) {
        return {
          isValid: false,
          errors: fullParseResult.errors.map(
            (e) => `Parse error: ${e.message} at row ${e.row}`,
          ),
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
        };
      }

      const data = fullParseResult.data as Record<string, string>[];

      if (data.length === 0) {
        return {
          isValid: false,
          errors: ["CSV file must have at least one data row"],
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
        };
      }

      const headers = Object.keys(data[0]);

      // Detect columns with enhanced logic
      const columnMapping = this.detectColumns(headers, data.slice(0, 10));

      // Detect variations from the entire dataset
      const detectedVariations = this.detectVariations(data, columnMapping);

      // Check for structural issues that should reject the file
      const structuralErrors: string[] = [];

      // Check for empty headers
      const emptyHeaders = headers.filter(
        (header) => !header || header.trim() === "",
      );
      if (emptyHeaders.length > 0) {
        structuralErrors.push(
          `Found ${emptyHeaders.length} empty column header(s). All columns must have names.`,
        );
      }

      // Check for duplicate headers
      const duplicateHeaders = headers.filter(
        (header, index) => headers.indexOf(header) !== index,
      );
      if (duplicateHeaders.length > 0) {
        structuralErrors.push(
          `Found duplicate column headers: ${[...new Set(duplicateHeaders)].join(", ")}`,
        );
      }

      // Check minimum column requirement (at least 3 columns for review, rating, date)
      if (headers.length < 3) {
        structuralErrors.push(
          "CSV must have at least 3 columns (review text, rating, date)",
        );
      }

      // Check minimum data rows
      if (data.length < 1) {
        structuralErrors.push("CSV must contain at least 1 data row");
      }

      const isValid = structuralErrors.length === 0;
      const errors = structuralErrors;

      // Create preview with first 10 rows
      const preview = data.slice(0, 10);

      return {
        isValid,
        errors,
        preview,
        detectedColumns: columnMapping,
        detectedVariations,
        totalRows: data.length,
        needsConfirmation: true, // Always ask for confirmation
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
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
      };
    }
  }

  private detectColumns(
    headers: string[],
    sampleData: Record<string, string>[],
  ): ColumnMapping {
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

    let reviewText = this.findColumn(
      headers,
      lowerHeaders,
      reviewTextCandidates,
    );

    // If no match, try to find column with longest average text
    if (!reviewText && sampleData.length > 0) {
      const avgLengths = headers.map((header) => {
        const lengths = sampleData.map((row) => (row[header] || "").length);
        return lengths.reduce((a, b) => a + b, 0) / lengths.length;
      });
      const maxIndex = avgLengths.indexOf(Math.max(...avgLengths));
      reviewText = headers[maxIndex];
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
      "overall",
    ];

    const rating = this.findColumn(headers, lowerHeaders, ratingCandidates);

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
      "reviewed_on",
    ];

    const date = this.findColumn(headers, lowerHeaders, dateCandidates);

    // Detect variation columns (both ID and name)
    let variationId = null;
    let variationName = null;

    // Look for ID columns
    for (const pattern of ID_COLUMN_PATTERNS) {
      const index = lowerHeaders.findIndex((h) => h.includes(pattern));
      if (index !== -1) {
        variationId = headers[index];
        break;
      }
    }

    // Look for variation name columns
    for (const pattern of VARIATION_NAME_PATTERNS) {
      const index = lowerHeaders.findIndex((h) => h.includes(pattern));
      if (index !== -1 && headers[index] !== variationId) {
        variationName = headers[index];
        break;
      }
    }

    // Collect unmapped columns
    const mappedColumns = [
      reviewText,
      rating,
      date,
      variationId,
      variationName,
    ].filter(Boolean);
    const unmappedColumns = headers.filter((h) => !mappedColumns.includes(h));

    return {
      reviewText,
      rating,
      date,
      variationId,
      variationName,
      unmappedColumns,
    };
  }

  private findColumn(
    headers: string[],
    lowerHeaders: string[],
    candidates: string[],
  ): string | null {
    for (const candidate of candidates) {
      const index = lowerHeaders.findIndex((h) => h.includes(candidate));
      if (index !== -1) {
        return headers[index];
      }
    }
    return null;
  }

  private detectVariations(
    data: Record<string, string>[],
    columnMapping: ColumnMapping,
  ): DetectedVariation[] {
    const variations = new Map<string, DetectedVariation>();

    // Count variations
    const variationCounts = new Map<string, number>();

    data.forEach((row) => {
      let variationKey = "";
      let variationDisplay = "";

      if (columnMapping.variationId && row[columnMapping.variationId]) {
        variationKey = row[columnMapping.variationId];
      }

      if (columnMapping.variationName && row[columnMapping.variationName]) {
        variationDisplay = row[columnMapping.variationName];
        if (!variationKey) variationKey = variationDisplay;
      }

      if (variationKey) {
        variationCounts.set(
          variationKey,
          (variationCounts.get(variationKey) || 0) + 1,
        );

        if (!variations.has(variationKey)) {
          const type = this.analyzeVariationType(
            variationDisplay || variationKey,
          );
          const attributes = this.extractAttributes(
            variationDisplay || variationKey,
          );

          variations.set(variationKey, {
            id: columnMapping.variationId ? variationKey : undefined,
            name: variationDisplay || variationKey,
            type,
            attributes:
              Object.keys(attributes).length > 0 ? attributes : undefined,
            reviewCount: 0,
          });
        }
      }
    });

    // Update review counts
    variations.forEach((variation, key) => {
      variation.reviewCount = variationCounts.get(key) || 0;
    });

    return Array.from(variations.values()).sort(
      (a, b) => b.reviewCount - a.reviewCount,
    );
  }

  private analyzeVariationType(
    text: string,
  ): "semantic" | "non-semantic" | "mixed" {
    const lower = text.toLowerCase();
    let semanticScore = 0;
    let nonSemanticScore = 0;

    // Check for semantic patterns
    Object.values(SEMANTIC_PATTERNS).forEach((patterns) => {
      patterns.forEach((pattern) => {
        if (lower.includes(pattern)) {
          semanticScore++;
        }
      });
    });

    // Check for non-semantic patterns (codes, IDs)
    if (/^[A-Z0-9]{3,}$/i.test(text)) nonSemanticScore += 2;
    if (/model\s*\d+/i.test(text)) nonSemanticScore++;
    if (/sku|asin|id/i.test(text)) nonSemanticScore++;
    if (/^[A-Z]{1,3}-?\d+/i.test(text)) nonSemanticScore++;

    if (semanticScore > 0 && nonSemanticScore > 0) return "mixed";
    if (semanticScore > nonSemanticScore) return "semantic";
    return "non-semantic";
  }

  private extractAttributes(text: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    const lower = text.toLowerCase();

    // Extract colors
    for (const color of SEMANTIC_PATTERNS.colors) {
      if (lower.includes(color)) {
        attributes.color = color;
        break;
      }
    }

    // Extract sizes
    for (const size of SEMANTIC_PATTERNS.sizes) {
      if (lower.includes(size)) {
        attributes.size = size;
        break;
      }
    }

    // Extract specific size measurements
    const sizeMatch = text.match(/(\d+)\s*(inch|inches|"|cm|mm)/i);
    if (sizeMatch) {
      attributes.size = sizeMatch[0];
    }

    // Extract flavors
    for (const flavor of SEMANTIC_PATTERNS.flavors) {
      if (lower.includes(flavor)) {
        attributes.flavor = flavor;
        break;
      }
    }

    // Extract materials
    for (const material of SEMANTIC_PATTERNS.materials) {
      if (lower.includes(material)) {
        attributes.material = material;
        break;
      }
    }

    // Extract model info
    const modelMatch = text.match(/model\s*(\w+)/i);
    if (modelMatch) {
      attributes.model = modelMatch[1];
    }

    return attributes;
  }

  async processCSVWithMapping(
    file: File,
    mapping: UserConfirmedMapping,
  ): Promise<{
    reviews: any[];
    totalRows: number;
    validRows: number;
    errors: string[];
    variations?: Record<string, { count: number; description?: string }>;
  }> {
    try {
      const fileContent = await file.text();
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        transformHeader: (header) => header.trim(),
        transform: (value) => value.trim(),
      });

      const data = parseResult.data as Record<string, string>[];
      const processedReviews: any[] = [];
      const errors: string[] = [];
      const variationStats: Record<
        string,
        { count: number; description?: string }
      > = {};

      // Process each row with the confirmed mapping
      data.forEach((row, index) => {
        try {
          const text = row[mapping.reviewText]?.trim();
          const ratingValue = row[mapping.rating];
          const dateValue = row[mapping.date];

          if (!text || text.length < 5) {
            throw new Error("Review text is too short");
          }

          const rating = Math.max(1, Math.min(5, parseFloat(ratingValue)));
          if (isNaN(rating)) {
            throw new Error("Invalid rating");
          }

          const date = new Date(dateValue);
          if (isNaN(date.getTime())) {
            throw new Error("Invalid date");
          }

          // Extract variation information
          let productVariation: string | undefined;
          if (mapping.variationName && row[mapping.variationName]) {
            productVariation = row[mapping.variationName].trim();
          } else if (mapping.variationId && row[mapping.variationId]) {
            productVariation = row[mapping.variationId].trim();
          }

          // Track variation statistics with user-edited names
          if (productVariation) {
            // Use edited name if provided, otherwise use original
            const displayName =
              mapping.variations?.[productVariation]?.name || productVariation;

            if (!variationStats[displayName]) {
              variationStats[displayName] = {
                count: 0,
                description:
                  mapping.variations?.[productVariation]?.description,
              };
            }
            variationStats[displayName].count++;
          }

          // Collect metadata
          const metadata: Record<string, any> = {};
          Object.keys(row).forEach((key) => {
            if (
              key !== mapping.reviewText &&
              key !== mapping.rating &&
              key !== mapping.date &&
              key !== mapping.variationId &&
              key !== mapping.variationName
            ) {
              metadata[key] = row[key];
            }
          });

          // Add variation information if provided
          let finalVariationName = productVariation;
          if (productVariation && mapping.variations?.[productVariation]) {
            // Use edited name if provided
            finalVariationName =
              mapping.variations[productVariation].name || productVariation;

            // Add description to metadata if provided
            if (mapping.variations[productVariation].description) {
              metadata.variationDescription =
                mapping.variations[productVariation].description;
            }

            // Add original variation name for reference if it was changed
            if (
              mapping.variations[productVariation].name &&
              mapping.variations[productVariation].name !== productVariation
            ) {
              metadata.originalVariationName = productVariation;
            }
          }

          processedReviews.push({
            text,
            rating,
            date,
            productVariation: finalVariationName,
            metadata,
          });
        } catch (error) {
          errors.push(
            `Row ${index + 2}: ${error instanceof Error ? error.message : "Processing error"}`,
          );
        }
      });

      return {
        reviews: processedReviews,
        totalRows: data.length,
        validRows: processedReviews.length,
        errors,
        variations:
          Object.keys(variationStats).length > 0 ? variationStats : undefined,
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
}

export const enhancedCSVService = new EnhancedCSVService();
