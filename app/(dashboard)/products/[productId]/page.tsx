// app/(dashboard)/products/[productId]/page.tsx - Updated with Unified Tabs
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import ProductPageWrapper from "@/components/ProductPageWrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UnifiedAnalysisTabs } from "@/components/unified-analysis-tabs";
import { ProductActions } from "@/components/product-actions";
import { FormattedDate } from "@/components/ui/FormattedDate";
import {
  ArrowLeft,
  Package,
  BarChart3,
  Download,
  RefreshCw,
  Users,
  Building2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { MarketingStrategist } from "@/components/marketing/MarketingStrategist";
import { ProductImprovementStrategist } from "@/components/improvement/ProductImprovementStrategist";
import { AmazonPlatformAdviser } from "@/components/amazon/AmazonPlatformAdviser";

async function getProduct(productId: string, userId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      brand: true,
      competitors: true,
      analyses: true,
    },
  });

  if (!product || product.brand.userId !== userId) {
    return null;
  }

  return product;
}

export default async function ProductAnalysisPage({
  params,
}: {
  params: { productId: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const product = await getProduct(params.productId, session.user.id);

  if (!product) {
    notFound();
  }

  const analyses = product.analyses.reduce(
    (acc, analysis) => {
      acc[analysis.type] = analysis;
      return acc;
    },
    {} as Record<string, any>,
  );

  const hasCompetitors = product.competitors.length > 0;

  // VOC sub-analyses that should be counted as one
  const vocSubAnalyses = [
    "voice_of_customer",
    "sentiment",
    "rating_analysis",
    "four_w_matrix",
  ];

  // Internal analysis types that should not be counted in UI
  const internalAnalyses = ["personas", "competition"];

  // Count analyses, treating VOC group as one and excluding internal types
  const getUniqueAnalysisCount = (analyses: any[]) => {
    // Filter out internal analysis types
    const visibleAnalyses = analyses.filter(
      (a) => !internalAnalyses.includes(a.type),
    );

    const vocCompleted = visibleAnalyses.some(
      (a) => vocSubAnalyses.includes(a.type) && a.status === "completed",
    );
    const nonVocCompleted = visibleAnalyses.filter(
      (a) => !vocSubAnalyses.includes(a.type) && a.status === "completed",
    ).length;
    return nonVocCompleted + (vocCompleted ? 1 : 0);
  };

  const expectedAnalyses = hasCompetitors ? 8 : 7; // 8 with competition, 7 without
  const completedAnalyses = getUniqueAnalysisCount(product.analyses);

  // Cap completion percentage at 100%
  const completionPercentage = Math.min(
    Math.round((completedAnalyses / expectedAnalyses) * 100),
    100,
  );

  const hasAnalysisData = completedAnalyses > 0;

  return (
    <ProductPageWrapper
      brandId={product.brand.id}
      productId={product.id}
      brandName={product.brand.name}
      productName={product.name}
      isProcessing={product.isProcessing}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/brands/${product.brand.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {product.brand.name}
              </Link>
            </Button>
            <div>
              <div className="flex items-center space-x-2">
                <Package className="h-6 w-6 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  {product.name}
                </h1>
              </div>
              <div className="flex items-center space-x-4 text-gray-600 mt-1">
                <span className="flex items-center">
                  <Building2 className="h-4 w-4 mr-1" />
                  {product.brand.name}
                </span>
                <span>{product.reviewsCount.toLocaleString()} reviews</span>
                <span>
                  Created <FormattedDate date={product.createdAt} />
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {hasAnalysisData && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/products/${product.id}/export`}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Link>
              </Button>
            )}

            {/* Product Actions Component (includes delete) */}
            <ProductActions product={product} />
          </div>
        </div>

        {/* Analysis Status and Progress Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analysis Progress
                </CardTitle>
                <CardDescription>
                  {completedAnalyses} of {expectedAnalyses} analyses completed
                </CardDescription>
              </div>
              {product.isProcessing && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Processing...</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={completionPercentage} className="w-full" />
          </CardContent>
        </Card>

        {/* Warning if no analyses completed */}
        {!hasAnalysisData && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">No Analysis Data Available</p>
                  <p className="text-sm">
                    Analysis is still processing or hasn't started yet. Please
                    wait for the analysis to complete before viewing results.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unified Analysis Tabs */}
        <Card>
          <CardContent className="pt-6">
            <UnifiedAnalysisTabs
              productId={product.id}
              brandId={product.brandId}
              productName={product.name}
              analyses={analyses}
              hasCompetitors={hasCompetitors}
            />
          </CardContent>
        </Card>

        {/* AI Strategic Advisors - Product Level */}
        {hasAnalysisData && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                🤖 AI Strategic Advisors
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Get strategic insights and recommendations for {product.name}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <MarketingStrategist
                brandId={product.brand.id}
                productId={product.id}
                brandName={product.brand.name}
                productName={product.name}
              />

              <ProductImprovementStrategist
                brandId={product.brand.id}
                productId={product.id}
                brandName={product.brand.name}
                productName={product.name}
              />

              <AmazonPlatformAdviser
                brandId={product.brand.id}
                productId={product.id}
                brandName={product.brand.name}
                productName={product.name}
              />
            </div>
          </div>
        )}
      </div>
    </ProductPageWrapper>
  );
}
