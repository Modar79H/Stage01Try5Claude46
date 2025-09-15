// app/(dashboard)/products/[productId]/export/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: { name: string };
  reviewsCount: number;
  analyses: Array<{
    type: string;
    data: any;
    status: string;
  }>;
}

export default function ExportPage() {
  const params = useParams();
  const productId = params.productId as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProductAndGenerateReport = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data.product);

          // Check if product has completed analyses
          const hasCompletedAnalyses = data.product.analyses.some(
            (a: any) => a.status === "completed",
          );

          if (hasCompletedAnalyses) {
            // Automatically start generating the report
            setTimeout(() => {
              generateReportAuto(data.product);
            }, 500);
          }
        } else {
          setError("Failed to fetch product data");
        }
      } catch (error) {
        setError("Error fetching product data");
      }
    };

    fetchProductAndGenerateReport();
  }, [productId]);

  const completedAnalyses =
    product?.analyses.filter((a) => a.status === "completed") || [];
  const totalAnalyses = product?.analyses.length || 0;

  const generateReportAuto = async (productData: Product) => {
    setIsGenerating(true);
    setProgress(0);
    setError("");

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`/api/products/${productId}/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);

        // Auto-download
        const a = document.createElement("a");
        a.href = url;
        a.download = `${productData?.name || "product"}-analysis-report.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Redirect back to product page after a short delay
        setTimeout(() => {
          window.location.href = `/products/${productId}`;
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to generate report");
      }
    } catch (error) {
      setError("Error generating report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md">
        {/* Generation Status */}
        {(isGenerating || (!error && !pdfUrl)) && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <FileText className="h-6 w-6" />
                Generating Export Report
              </CardTitle>
              <CardDescription>
                {product
                  ? `Preparing ${product.name} analysis report...`
                  : "Loading product data..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">
                    {isGenerating ? "Generating report..." : "Initializing..."}
                  </span>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-gray-500 text-center">
                  This may take a few moments as we compile all your analyses.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success */}
        {pdfUrl && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-green-700">
                <Download className="h-6 w-6" />
                Report Generated Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-green-700 mb-2">
                  Your report has been downloaded automatically.
                </p>
                <p className="text-xs text-green-600">
                  Redirecting back to product page...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Analyses Warning */}
        {product && completedAnalyses.length === 0 && !isGenerating && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="text-center">
              <CardTitle className="text-yellow-800">
                No Completed Analyses
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-yellow-700 mb-4">
                  You need at least one completed analysis to generate a report.
                </p>
                <Button asChild variant="outline">
                  <Link href={`/products/${productId}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Product
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
