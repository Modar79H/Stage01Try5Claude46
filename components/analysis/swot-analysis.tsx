// components/analysis/swot-analysis.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SWOTChart } from "@/components/charts/swot-chart";
import {
  Shield,
  AlertCircle,
  Quote,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertTriangle,
  Info,
} from "lucide-react";
import { TemporalBadge, TrendIndicator } from "@/components/temporal";
import { TemporalTrend } from "@/lib/types/temporal";
import { BadgeTooltip } from "./BadgeTooltip";

interface SWOTAnalysisProps {
  analysis?: {
    data: {
      swot_analysis?: {
        strengths: Array<{
          topic: string;
          percentage: string;
          summary: string;
          example_quote: string;
          temporal_trend?: TemporalTrend;
        }>;
        weaknesses: Array<{
          topic: string;
          percentage: string;
          summary: string;
          example_quote: string;
          temporal_trend?: TemporalTrend;
        }>;
        opportunities: Array<{
          topic: string;
          percentage: string;
          summary: string;
          example_quote: string;
          temporal_trend?: TemporalTrend;
        }>;
        threats: Array<{
          topic: string;
          percentage: string;
          summary: string;
          example_quote: string;
          temporal_trend?: TemporalTrend;
        }>;
      };
    };
    status: string;
    error?: string;
  };
}

const getSWOTInfo = (type: string) => {
  switch (type) {
    case "strengths":
      return {
        icon: <TrendingUp className="h-5 w-5" />,
        title: "Strengths",
        description: "Internal positive factors",
        color: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-500",
        badgeColor: "bg-green-100 text-green-800",
      };
    case "weaknesses":
      return {
        icon: <TrendingDown className="h-5 w-5" />,
        title: "Weaknesses",
        description: "Internal areas for improvement",
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-500",
        badgeColor: "bg-red-100 text-red-800",
      };
    case "opportunities":
      return {
        icon: <Lightbulb className="h-5 w-5" />,
        title: "Opportunities",
        description: "External positive potential",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-500",
        badgeColor: "bg-blue-100 text-blue-800",
      };
    case "threats":
      return {
        icon: <AlertTriangle className="h-5 w-5" />,
        title: "Threats",
        description: "External risks and challenges",
        color: "text-orange-700",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-500",
        badgeColor: "bg-orange-100 text-orange-800",
      };
    default:
      return {
        icon: <Shield className="h-5 w-5" />,
        title: "SWOT",
        description: "",
        color: "text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-500",
        badgeColor: "bg-gray-100 text-gray-800",
      };
  }
};

export function SWOTAnalysis({ analysis }: SWOTAnalysisProps) {
  if (!analysis || analysis.status !== "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 mr-3">
              <Shield className="h-5 w-5 text-white" />
            </div>
            SWOT Analysis
          </CardTitle>
          <CardDescription>
            Strengths, Weaknesses, Opportunities, and Threats analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analysis?.status === "failed" ? (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Analysis failed: {analysis.error || "Unknown error"}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gradient-primary mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Analysis in progress...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const data = analysis.data?.swot_analysis;

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 mr-3">
              <Shield className="h-5 w-5 text-white" />
            </div>
            SWOT Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            No SWOT analysis data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  const swotCategories = [
    { key: "strengths", data: data.strengths || [] },
    { key: "weaknesses", data: data.weaknesses || [] },
    { key: "opportunities", data: data.opportunities || [] },
    { key: "threats", data: data.threats || [] },
  ];

  return (
    <div className="space-y-6">
      {/* Charts Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 mr-3">
              <Shield className="h-5 w-5 text-white" />
            </div>
            SWOT Distribution
          </CardTitle>
          <CardDescription>
            Visual breakdown of SWOT factors by frequency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SWOTChart data={data} />
        </CardContent>
      </Card>

      {/* Detailed SWOT Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {swotCategories.map((category) => {
          if (!category.data || category.data.length === 0) return null;

          const categoryInfo = getSWOTInfo(category.key);

          return (
            <Card key={category.key}>
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-r ${category.key === "strengths" ? "from-green-500 to-emerald-500" : category.key === "weaknesses" ? "from-red-500 to-pink-500" : category.key === "opportunities" ? "from-blue-500 to-indigo-500" : "from-orange-500 to-red-500"} mr-3`}
                  >
                    <div className="text-white">{categoryInfo.icon}</div>
                  </div>
                  <span>{categoryInfo.title}</span>
                </CardTitle>
                <CardDescription>{categoryInfo.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.data
                    .filter((item: any) => {
                      if (!item.percentage) return true; // Keep topics without percentage
                      const value = parseFloat(item.percentage.replace('%', ''));
                      return value >= 1; // Only keep topics with 1% or higher
                    })
                    .sort((a: any, b: any) => {
                      const aValue = parseFloat(a.percentage?.replace('%', '') || '0');
                      const bValue = parseFloat(b.percentage?.replace('%', '') || '0');
                      return bValue - aValue;
                    })
                    .map((item, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-gradient-primary pl-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-r-lg p-4 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-base text-gray-900 dark:text-white">
                            {item.topic}
                          </h4>
                          {item.temporal_trend && (
                            <TrendIndicator 
                              status={item.temporal_trend.status} 
                              timeline={item.temporal_trend.timeline}
                              size="sm"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {item.temporal_trend && (
                            <BadgeTooltip 
                              type="trend" 
                              value={item.temporal_trend.status}
                              description={item.temporal_trend.trend_summary}
                            >
                              <div>
                                <TemporalBadge 
                                  status={item.temporal_trend.status} 
                                  size="sm"
                                />
                              </div>
                            </BadgeTooltip>
                          )}
                          <BadgeTooltip type="percentage" value={item.percentage}>
                            <Badge
                              variant={
                                category.key === "strengths"
                                  ? "success"
                                  : category.key === "weaknesses"
                                    ? "destructive"
                                    : category.key === "opportunities"
                                      ? "info"
                                      : "warning"
                              }
                              size="sm"
                            >
                              {item.percentage || 'Calculating...'}
                            </Badge>
                          </BadgeTooltip>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                        {item.summary}
                      </p>
                      {item.temporal_trend && item.temporal_trend.trend_summary && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">
                          <strong>Over Time:</strong> {item.temporal_trend.trend_summary}
                          {item.temporal_trend.last_mentioned && item.temporal_trend.status === 'RESOLVED' && (
                            <span className="ml-2 text-green-600 dark:text-green-400">
                              (Last mentioned: {item.temporal_trend.last_mentioned})
                            </span>
                          )}
                        </div>
                      )}
                      {item.example_quote && (
                        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <Quote className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                            <p className="italic text-sm text-gray-700 dark:text-gray-300">
                              "{item.example_quote}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Strategic Implications */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
        <CardHeader>
          <CardTitle className="text-indigo-900 dark:text-indigo-100 flex items-center">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 mr-3">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            Strategic Implications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20 dark:border-gray-700/20 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mr-3">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-100">
                  Leverage Strengths
                </h4>
              </div>
              <ul className="text-sm space-y-2">
                {data.strengths &&
                  data.strengths.slice(0, 2).map((strength, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-indigo-800 dark:text-indigo-200">
                        Use {strength.topic.toLowerCase()} to expand market
                        share
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20 dark:border-gray-700/20 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center mr-3">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-100">
                  Address Weaknesses
                </h4>
              </div>
              <ul className="text-sm space-y-2">
                {data.weaknesses &&
                  data.weaknesses.slice(0, 2).map((weakness, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-indigo-800 dark:text-indigo-200">
                        Improve {weakness.topic.toLowerCase()} to enhance
                        competitiveness
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20 dark:border-gray-700/20 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center mr-3">
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-100">
                  Pursue Opportunities
                </h4>
              </div>
              <ul className="text-sm space-y-2">
                {data.opportunities &&
                  data.opportunities.slice(0, 2).map((opportunity, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-indigo-800 dark:text-indigo-200">
                        Capitalize on {opportunity.topic.toLowerCase()}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20 dark:border-gray-700/20 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center mr-3">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-100">
                  Mitigate Threats
                </h4>
              </div>
              <ul className="text-sm space-y-2">
                {data.threats &&
                  data.threats.slice(0, 2).map((threat, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-indigo-800 dark:text-indigo-200">
                        Defend against {threat.topic.toLowerCase()}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
