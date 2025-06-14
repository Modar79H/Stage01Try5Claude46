// app/(dashboard)/products/[productId]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AnalysisStatus } from "@/components/analysis-status";
import { ProductDescription } from "@/components/analysis/product-description";
import { SentimentAnalysis } from "@/components/analysis/sentiment-analysis";
import { VoiceOfCustomer } from "@/components/analysis/voice-of-customer";
import { FourWMatrix } from "@/components/analysis/four-w-matrix";
import { JTBDAnalysis } from "@/components/analysis/jtbd-analysis";
import { STPAnalysis } from "@/components/analysis/stp-analysis";
import { SWOTAnalysis } from "@/components/analysis/swot-analysis";
import { CustomerJourney } from "@/components/analysis/customer-journey";
import { CustomerPersonas } from "@/components/analysis/customer-personas";
import { CompetitionAnalysis } from "@/components/analysis/competition-analysis";
import { StrategicRecommendations } from "@/components/analysis/strategic-recommendations";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  BarChart3,
  Download,
  RefreshCw,
  Users,
  Building2,
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
  const expectedAnalyses = hasCompetitors ? 11 : 10;
  const completedAnalyses = product.analyses.filter(
    (a) => a.status === "completed",
  ).length;
  const completionPercentage = Math.round(
    (completedAnalyses / expectedAnalyses) * 100,
  );

  return (
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
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/products/${product.id}/competitors`}>
              <Users className="h-4 w-4 mr-2" />
              Manage Competitors
            </Link>
          </Button>
          {completionPercentage > 0 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/products/${product.id}/export`}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Link>
            </Button>
          )}
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

      {/* Analysis Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="product_description" className="w-full">
            <TabsList className="w-full h-auto flex-wrap justify-start gap-1 p-1 bg-gray-50">
              <TabsTrigger value="product_description" className="text-xs">
                Product Description
              </TabsTrigger>
              <TabsTrigger value="sentiment" className="text-xs">
                Sentiment
              </TabsTrigger>
              <TabsTrigger value="voice_of_customer" className="text-xs">
                Voice of Customer
              </TabsTrigger>
              <TabsTrigger value="four_w_matrix" className="text-xs">
                4W Matrix
              </TabsTrigger>
              <TabsTrigger value="jtbd" className="text-xs">
                Jobs to be Done
              </TabsTrigger>
              <TabsTrigger value="stp" className="text-xs">
                STP Analysis
              </TabsTrigger>
              <TabsTrigger value="swot" className="text-xs">
                SWOT
              </TabsTrigger>
              <TabsTrigger value="customer_journey" className="text-xs">
                Customer Journey
              </TabsTrigger>
              <TabsTrigger value="personas" className="text-xs">
                Personas
              </TabsTrigger>
              {hasCompetitors && (
                <TabsTrigger value="competition" className="text-xs">
                  Competition
                </TabsTrigger>
              )}
              <TabsTrigger
                value="strategic_recommendations"
                className="text-xs"
              >
                Recommendations
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="product_description">
                <ProductDescription analysis={analyses.product_description} />
              </TabsContent>

              <TabsContent value="sentiment">
                <SentimentAnalysis analysis={analyses.sentiment} />
              </TabsContent>

              <TabsContent value="voice_of_customer">
                <VoiceOfCustomer analysis={analyses.voice_of_customer} />
              </TabsContent>

              <TabsContent value="four_w_matrix">
                <FourWMatrix analysis={analyses.four_w_matrix} />
              </TabsContent>

              <TabsContent value="jtbd">
                <JTBDAnalysis analysis={analyses.jtbd} />
              </TabsContent>

              <TabsContent value="stp">
                <STPAnalysis analysis={analyses.stp} />
              </TabsContent>

              <TabsContent value="swot">
                <SWOTAnalysis analysis={analyses.swot} />
              </TabsContent>

              <TabsContent value="customer_journey">
                <CustomerJourney analysis={analyses.customer_journey} />
              </TabsContent>

              <TabsContent value="personas">
                <CustomerPersonas analysis={analyses.personas} />
              </TabsContent>

              {hasCompetitors && (
                <TabsContent value="competition">
                  <CompetitionAnalysis analysis={analyses.competition} />
                </TabsContent>
              )}

              <TabsContent value="strategic_recommendations">
                <StrategicRecommendations
                  analysis={analyses.strategic_recommendations}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
