// components/analysis/product-description.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertCircle } from "lucide-react";

interface ProductDescriptionProps {
  analysis?: {
    data: {
      product_description?: {
        summary: string;
        attributes: string[];
        variations: string[];
      };
    };
    status: string;
    error?: string;
  };
}

export function ProductDescription({ analysis }: ProductDescriptionProps) {
  if (!analysis || analysis.status !== "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Product Description
          </CardTitle>
          <CardDescription>
            AI-generated product description based on customer reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analysis?.status === "failed" ? (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Analysis failed: {analysis.error || "Unknown error"}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analysis in progress...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const data = analysis.data.product_description;

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Product Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            No product description data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Product Description
          </CardTitle>
          <CardDescription>
            AI-generated product description based on customer reviews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Product Summary</h3>
            <p className="text-gray-700 leading-relaxed">{data.summary}</p>
          </div>

          {/* Attributes */}
          {data.attributes && data.attributes.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Key Attributes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.attributes.map((attribute, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-gray-700">{attribute}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variations */}
          {data.variations && data.variations.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Product Variations</h3>
              <div className="flex flex-wrap gap-2">
                {data.variations.map((variation, index) => (
                  <Badge key={index} variant="secondary">
                    {variation}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
