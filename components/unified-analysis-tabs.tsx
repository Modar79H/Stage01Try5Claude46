// components/unified-analysis-tabs.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ProductDescription } from "@/components/analysis/product-description";
import { VOCCombined } from "@/components/analysis/voc-combined";
import { JTBDAnalysis } from "@/components/analysis/jtbd-analysis";
import { STPAnalysis } from "@/components/analysis/stp-analysis";
import { SWOTAnalysis } from "@/components/analysis/swot-analysis";
import { CustomerJourney } from "@/components/analysis/customer-journey";
import { SmartCompetitionAnalysis } from "@/components/analysis/smart-competition-analysis";
import { StrategicRecommendations } from "@/components/analysis/strategic-recommendations";

interface UnifiedAnalysisTabsProps {
  productId: string;
  brandId: string;
  productName: string;
  analyses: Record<string, any>;
  hasCompetitors: boolean;
}

const ANALYSIS_CONFIGS = [
  {
    key: "product_description",
    label: "Product Description",
    component: ProductDescription,
    props: (analyses: any) => ({ analysis: analyses.product_description }),
  },
  {
    key: "voc_group",
    label: "VOC (Voice of Customer)",
    component: VOCCombined,
    props: (analyses: any) => ({
      analyses: {
        voice_of_customer: analyses.voice_of_customer,
        rating_analysis: analyses.rating_analysis,
        sentiment: analyses.sentiment,
        four_w_matrix: analyses.four_w_matrix,
      },
    }),
  },
  {
    key: "jtbd",
    label: "Jobs to be Done",
    component: JTBDAnalysis,
    props: (analyses: any) => ({ analysis: analyses.jtbd }),
  },
  {
    key: "stp",
    label: "STP Analysis",
    component: STPAnalysis,
    props: (
      analyses: any,
      brandId: string,
      productId: string,
      productName: string,
    ) => ({
      analysis: analyses.stp,
      brandId,
      productId,
      productName,
    }),
  },
  {
    key: "swot",
    label: "SWOT Analysis",
    component: SWOTAnalysis,
    props: (analyses: any) => ({ analysis: analyses.swot }),
  },
  {
    key: "customer_journey",
    label: "Customer Journey",
    component: CustomerJourney,
    props: (analyses: any) => ({ analysis: analyses.customer_journey }),
  },
  {
    key: "smart_competition",
    label: "Smart Competition Analysis",
    component: SmartCompetitionAnalysis,
    props: (analyses: any) => ({ analysis: analyses.smart_competition }),
  },
  {
    key: "strategic_recommendations",
    label: "Strategic Recommendations",
    component: StrategicRecommendations,
    props: (analyses: any) => ({
      analysis: analyses.strategic_recommendations,
    }),
  },
];

// VOC sub-analyses
const VOC_SUB_TYPES = [
  "voice_of_customer",
  "sentiment",
  "rating_analysis",
  "four_w_matrix",
];

export function UnifiedAnalysisTabs({
  productId,
  brandId,
  productName,
  analyses,
  hasCompetitors,
}: UnifiedAnalysisTabsProps) {
  const [openTab, setOpenTab] = useState<string | null>("product_description");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentAnalyses, setCurrentAnalyses] = useState(analyses);

  // Update currentAnalyses when analyses prop changes
  useEffect(() => {
    setCurrentAnalyses(analyses);
  }, [analyses]);

  const visibleAnalyses = hasCompetitors
    ? ANALYSIS_CONFIGS
    : ANALYSIS_CONFIGS.filter((a) => a.key !== "smart_competition");

  const refreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(
        `/api/products/${productId}/analysis/status`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data.analyses) {
          // Convert array to object
          const analysesMap = data.analyses.reduce(
            (acc: any, analysis: any) => {
              acc[analysis.type] = analysis;
              return acc;
            },
            {},
          );
          setCurrentAnalyses(analysesMap);
        }
      }
    } catch (error) {
      console.error("Error refreshing status:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getAnalysisStatus = (analysisKey: string) => {
    if (analysisKey === "voc_group") {
      // For VOC group, check if any of the sub-analyses are completed
      const vocAnalyses = VOC_SUB_TYPES.map(
        (type) => currentAnalyses[type],
      ).filter(Boolean);
      if (vocAnalyses.length > 0) {
        const hasCompleted = vocAnalyses.some((a) => a?.status === "completed");
        const hasProcessing = vocAnalyses.some(
          (a) => a?.status === "processing",
        );
        const hasFailed = vocAnalyses.some((a) => a?.status === "failed");

        if (hasCompleted) return "completed";
        if (hasProcessing) return "processing";
        if (hasFailed) return "failed";
      }
      return "pending";
    }

    const analysis = currentAnalyses[analysisKey];
    return analysis?.status || "pending";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "processing":
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
        );
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const handleTabClick = (analysisKey: string) => {
    const status = getAnalysisStatus(analysisKey);
    if (status === "completed") {
      setOpenTab(openTab === analysisKey ? null : analysisKey);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900">Analysis Results</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshStatus}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {visibleAnalyses.map((analysisConfig) => {
          const status = getAnalysisStatus(analysisConfig.key);
          const isOpen = openTab === analysisConfig.key;
          const isClickable = status === "completed";

          return (
            <div key={analysisConfig.key} className="col-span-1">
              <div
                className={`
                  flex items-center justify-between p-3 border rounded-lg
                  ${isClickable ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" : "cursor-not-allowed opacity-75"}
                  ${isOpen ? "bg-gray-50 dark:bg-gray-800 border-blue-500" : ""}
                  transition-all duration-200
                `}
                onClick={() => handleTabClick(analysisConfig.key)}
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(status)}
                  <div>
                    <p className="font-medium text-sm">
                      {analysisConfig.label}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(status)}
                  {isClickable &&
                    (isOpen ? (
                      <ChevronUp className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analysis Content */}
      {openTab && (
        <div className="mt-6 border rounded-lg p-6 bg-white dark:bg-gray-900">
          {(() => {
            const config = ANALYSIS_CONFIGS.find((c) => c.key === openTab);
            if (!config) return null;

            const Component = config.component;
            const props =
              config.key === "stp"
                ? config.props(currentAnalyses, brandId, productId, productName)
                : config.props(currentAnalyses);

            return <Component {...props} />;
          })()}
        </div>
      )}
    </div>
  );
}
