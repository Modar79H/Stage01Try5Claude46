// app/(dashboard)/products/[productId]/export/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";

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
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
      } else {
        setError("Failed to fetch product data");
      }
    } catch (error) {
      setError("Error fetching product data");
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    setProgress(0);
    setError("");

    try {
      // Simulate progress
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
        a.download = `${product?.name || "product"}-analysis-report.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to generate PDF");
      }
    } catch (error) {
      setError("Error generating PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const completedAnalyses =
    product?.analyses.filter((a) => a.status === "completed") || [];
  const totalAnalyses = product?.analyses.length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/products/${productId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analysis
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Export PDF Report
          </h1>
          <p className="text-gray-600 mt-1">
            Generate a comprehensive analysis report
          </p>
        </div>
      </div>

      {/* Product Info */}
      {product && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Report Details
            </CardTitle>
            <CardDescription>
              Your comprehensive analysis report will include all completed
              analyses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Product</p>
                <p className="font-medium">{product.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Brand</p>
                <p className="font-medium">{product.brand.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reviews Analyzed</p>
                <p className="font-medium">
                  {product.reviewsCount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed Analyses</p>
                <p className="font-medium">
                  {completedAnalyses.length} of {totalAnalyses}
                </p>
              </div>
            </div>

            {/* Analysis List */}
            <div>
              <h4 className="font-semibold mb-2">Included Analyses:</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Product Description",
                  "Sentiment Analysis",
                  "Voice of Customer",
                  "4W Matrix",
                  "Jobs to be Done",
                  "STP Analysis",
                  "SWOT Analysis",
                  "Customer Journey",
                  "Customer Personas",
                  "Competition Analysis",
                  "Strategic Recommendations",
                ].map((analysisName, index) => {
                  const isCompleted = completedAnalyses.some((a) =>
                    a.type
                      .replace("_", " ")
                      .toLowerCase()
                      .includes(analysisName.toLowerCase().split(" ")[0]),
                  );
                  return (
                    <div
                      key={index}
                      className={`text-sm p-2 rounded ${
                        isCompleted
                          ? "bg-green-50 text-green-800"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {analysisName} {isCompleted ? "✓" : "(pending)"}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Status */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">
                  Generating PDF report...
                </span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-gray-500">
                This may take a few moments as we compile all your analyses into
                a comprehensive report.
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
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
                <Download className="h-5 w-5" />
                <span className="font-medium">PDF Generated Successfully!</span>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Your report has been generated and should download
                automatically.
              </p>
              <Button asChild variant="outline">
                <a
                  href={pdfUrl}
                  download={`${product?.name || "product"}-analysis-report.pdf`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Again
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      {!isGenerating && !pdfUrl && completedAnalyses.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Button onClick={generatePDF} size="lg" className="px-8">
                <Download className="h-5 w-5 mr-2" />
                Generate PDF Report
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                Generate a comprehensive PDF report with all completed analyses
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Analyses Warning */}
      {completedAnalyses.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-yellow-800 font-medium mb-2">
                No Completed Analyses
              </p>
              <p className="text-sm text-yellow-700">
                You need at least one completed analysis to generate a PDF
                report.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href={`/products/${productId}`}>
                  View Analysis Status
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
