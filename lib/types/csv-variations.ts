// lib/types/csv-variations.ts

export interface VariationColumn {
  columnName: string;
  columnType: "id" | "name" | "unknown";
  sampleValues: string[];
}

export interface DetectedVariation {
  id?: string;
  name: string;
  type: "semantic" | "non-semantic" | "mixed";
  attributes?: {
    color?: string;
    size?: string;
    flavor?: string;
    material?: string;
    model?: string;
    style?: string;
    [key: string]: string | undefined;
  };
  reviewCount: number;
}

export interface ColumnMapping {
  reviewText: string | null;
  rating: string | null;
  date: string | null;
  variationId?: string | null;
  variationName?: string | null;
  unmappedColumns: string[];
}

export interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  preview: any[];
  detectedColumns: ColumnMapping;
  detectedVariations: DetectedVariation[];
  totalRows: number;
  needsConfirmation: boolean;
}

export interface UserConfirmedMapping {
  reviewText: string;
  rating: string;
  date: string;
  variationId?: string;
  variationName?: string;
  variations?: {
    [key: string]: {
      name: string;
      description?: string;
    };
  };
}

// Semantic patterns for variation detection
export const SEMANTIC_PATTERNS = {
  colors: [
    "red",
    "blue",
    "green",
    "black",
    "white",
    "yellow",
    "purple",
    "orange",
    "pink",
    "brown",
    "gray",
    "grey",
    "silver",
    "gold",
    "navy",
    "teal",
  ],
  sizes: [
    "small",
    "medium",
    "large",
    "xl",
    "xxl",
    "xs",
    "tiny",
    "mini",
    "big",
    "petite",
    "plus",
    "regular",
    "tall",
    "short",
    "inch",
    "inches",
    '"',
    "cm",
    "mm",
    "size",
  ],
  flavors: [
    "vanilla",
    "chocolate",
    "strawberry",
    "mint",
    "caramel",
    "coffee",
    "mocha",
    "cherry",
    "lemon",
    "orange",
    "apple",
    "grape",
    "berry",
    "flavor",
    "flavour",
    "taste",
  ],
  materials: [
    "cotton",
    "polyester",
    "leather",
    "silk",
    "wool",
    "nylon",
    "rubber",
    "plastic",
    "metal",
    "wood",
    "glass",
    "steel",
    "aluminum",
    "copper",
  ],
  models: [
    "model",
    "version",
    "edition",
    "series",
    "gen",
    "generation",
    "pro",
    "plus",
    "max",
    "mini",
    "air",
    "standard",
    "premium",
    "basic",
  ],
};

// Common ID column patterns
export const ID_COLUMN_PATTERNS = [
  "asin",
  "sku",
  "code",
  "ref",
  "reference",
  "item_id",
  "product_id",
  "variant_id",
  "variation_id",
  "model_id",
  "style_id",
  "variation",
];

// Common variation name column patterns
export const VARIATION_NAME_PATTERNS = [
  "style",
  "style_name",
  "variant",
  "variant_name",
  "variation_name",
  "model",
  "model_name",
  "type",
  "product_type",
  "color",
  "size",
  "flavor",
];
