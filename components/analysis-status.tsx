// components/analysis-status.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";

interface AnalysisStatusProps {
  productId: string;
  analyses: Array<{
    type: string;
    status: string;
    error?: string | null;
  }>;
  hasCompetitors: boolean;
}

const ANALYSIS_TYPES = [
  { key: "product_description", label: "Product Description" },
  { key: "sentiment", label: "Sentiment Analysis" },
  { key: "voice_of_customer", label: "Voice of Customer" },
  { key: "four_w_matrix", label: "4W Matrix" },
  { key: "jtbd", label: "Jobs to be Done" },
  { key: "stp", label: "STP Analysis" },
  { key: "swot", label: "SWOT Analysis" },
  { key: "customer_journey", label: "Customer Journey" },
  { key: "personas", label: "Customer Personas" },
  { key: "competition", label: "Competition Analysis" },
  { key: "smart_competition", label: "🧠 Smart Competition Analysis" },
  { key: "strategic_recommendations", label: "Strategic Recommendations" },
];

export function AnalysisStatus({
  productId,
  analyses,
  hasCompetitors,
}: AnalysisStatusProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentAnalyses, setCurrentAnalyses] = useState(analyses);

  const analysisMap = currentAnalyses.reduce(
    (acc, analysis) => {
      acc[analysis.type] = analysis;
      return acc;
    },
    {} as Record<string, any>,
  );

  const visibleAnalyses = hasCompetitors
    ? ANALYSIS_TYPES
    : ANALYSIS_TYPES.filter(
        (a) => !["competition", "smart_competition"].includes(a.key),
      );

  const refreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(
        `/api/products/${productId}/analysis/status`,
      );
      if (response.ok) {
        const data = await response.json();
        // Update the current analyses state with the fetched data
        if (data.analyses) {
          setCurrentAnalyses(data.analyses);
        }
      }
    } catch (error) {
      console.error("Error refreshing status:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const retryAnalysis = async (analysisType: string) => {
    try {
      const response = await fetch(
        `/api/products/${productId}/analysis/restart`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ analysisType }),
        },
      );

      if (response.ok) {
        refreshStatus();
      }
    } catch (error) {
      console.error("Error retrying analysis:", error);
    }
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900">Analysis Progress</h3>
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
        {visibleAnalyses.map((analysisType) => {
          const analysis = analysisMap[analysisType.key];
          const status = analysis?.status || "pending";

          return (
            <div
              key={analysisType.key}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(status)}
                <div>
                  <p className="font-medium text-sm">{analysisType.label}</p>
                  {analysis?.error && (
                    <p className="text-xs text-red-600 mt-1">
                      {analysis.error}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(status)}
                {status === "failed" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => retryAnalysis(analysisType.key)}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
