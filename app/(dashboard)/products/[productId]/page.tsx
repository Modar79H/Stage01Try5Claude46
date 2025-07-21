// app/(dashboard)/products/[productId]/page.tsx - Updated with Delete Button
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
import { CollapsibleAnalysis } from "@/components/collapsible-analysis";
import { Progress } from "@/components/ui/progress";
import { AnalysisStatus } from "@/components/analysis-status";
import { ProductDescription } from "@/components/analysis/product-description";
import { VOCCombined } from "@/components/analysis/voc-combined";
import { JTBDAnalysis } from "@/components/analysis/jtbd-analysis";
import { STPAnalysis } from "@/components/analysis/stp-analysis";
import { SWOTAnalysis } from "@/components/analysis/swot-analysis";
import { CustomerJourney } from "@/components/analysis/customer-journey";
import { CustomerPersonas } from "@/components/analysis/customer-personas";
import { CompetitionAnalysis } from "@/components/analysis/competition-analysis";
import { SmartCompetitionAnalysis } from "@/components/analysis/smart-competition-analysis";
import { StrategicRecommendations } from "@/components/analysis/strategic-recommendations";
import { ProductActions } from "@/components/product-actions";
import { MarketingStrategist } from "@/components/marketing/MarketingStrategist";
import { ProductImprovementStrategist } from "@/components/improvement/ProductImprovementStrategist";
import { AmazonPlatformAdviser } from "@/components/amazon/AmazonPlatformAdviser";
import { formatDate } from "@/lib/utils";
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
  const expectedAnalyses = hasCompetitors ? 12 : 10; // 12 includes smart_competition
  const completedAnalyses = product.analyses.filter(
    (a) => a.status === "completed",
  ).length;
  const completionPercentage = Math.round(
    (completedAnalyses / expectedAnalyses) * 100,
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
                <span>Created {formatDate(product.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/products/${product.id}/competitors`}>
                <Users className="h-4 w-4 mr-2" />
                Manage Competitors
              </Link>
            </Button>

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

        {/* Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analysis Status
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
            <div className="space-y-4">
              <Progress value={completionPercentage} className="w-full" />
              <AnalysisStatus
                productId={product.id}
                analyses={product.analyses}
                hasCompetitors={hasCompetitors}
              />
            </div>
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

        {/* Analysis Sections - Only show if we have data */}
        {hasAnalysisData && (
          <div className="space-y-4">
            <CollapsibleAnalysis title="Product Description" defaultOpen={true}>
              <ProductDescription analysis={analyses.product_description} />
            </CollapsibleAnalysis>

            <CollapsibleAnalysis
              title="VOC (Voice of Customer)"
              defaultOpen={false}
            >
              <VOCCombined
                analyses={{
                  voice_of_customer: analyses.voice_of_customer,
                  rating_analysis: analyses.rating_analysis,
                  sentiment: analyses.sentiment,
                  four_w_matrix: analyses.four_w_matrix,
                }}
              />
            </CollapsibleAnalysis>

            <CollapsibleAnalysis title="Jobs to be Done" defaultOpen={false}>
              <JTBDAnalysis analysis={analyses.jtbd} />
            </CollapsibleAnalysis>

            <CollapsibleAnalysis title="STP Analysis" defaultOpen={false}>
              <STPAnalysis
                analysis={analyses.stp}
                brandId={product.brandId}
                productId={product.id}
                productName={product.name}
              />
            </CollapsibleAnalysis>

            <CollapsibleAnalysis title="SWOT Analysis" defaultOpen={false}>
              <SWOTAnalysis analysis={analyses.swot} />
            </CollapsibleAnalysis>

            <CollapsibleAnalysis title="Customer Journey" defaultOpen={false}>
              <CustomerJourney analysis={analyses.customer_journey} />
            </CollapsibleAnalysis>

            <CollapsibleAnalysis title="Customer Personas" defaultOpen={false}>
              <CustomerPersonas
                analysis={analyses.personas}
                brandId={product.brandId}
                productId={product.id}
                productName={product.name}
              />
            </CollapsibleAnalysis>

            {hasCompetitors && (
              <CollapsibleAnalysis
                title="Competition Analysis"
                defaultOpen={false}
              >
                <CompetitionAnalysis analysis={analyses.competition} />
              </CollapsibleAnalysis>
            )}

            {hasCompetitors && (
              <CollapsibleAnalysis
                title="🧠 Smart Competition Analysis"
                defaultOpen={false}
              >
                <SmartCompetitionAnalysis
                  analysis={analyses.smart_competition}
                />
              </CollapsibleAnalysis>
            )}

            <CollapsibleAnalysis
              title="Strategic Recommendations"
              defaultOpen={false}
            >
              <StrategicRecommendations
                analysis={analyses.strategic_recommendations}
              />
            </CollapsibleAnalysis>
          </div>
        )}

        {/* AI Strategist Chatbots Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MarketingStrategist
            brandId={product.brandId}
            productId={product.id}
            brandName={product.brand.name}
            productName={product.name}
          />

          <ProductImprovementStrategist
            brandId={product.brandId}
            productId={product.id}
            brandName={product.brand.name}
            productName={product.name}
          />

          <AmazonPlatformAdviser
            brandId={product.brandId}
            productId={product.id}
            brandName={product.brand.name}
            productName={product.name}
          />
        </div>
      </div>
    </ProductPageWrapper>
  );
}
