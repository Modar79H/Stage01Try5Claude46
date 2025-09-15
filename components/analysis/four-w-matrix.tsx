// components/analysis/four-w-matrix.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FourWChart } from "@/components/charts/four-w-chart";
import {
  Grid3X3,
  AlertCircle,
  Quote,
  Users,
  Package,
  MapPin,
  Clock,
  Info,
} from "lucide-react";
import { TemporalBadge, TrendIndicator } from "@/components/temporal";
import { TemporalTrend } from "@/lib/types/temporal";
import { BadgeTooltip } from "./BadgeTooltip";

interface FourWMatrixProps {
  analysis?: {
    data: {
      four_w_matrix?: {
        who: Array<{
          topic: string;
          importance: string;
          percentage: string;
          summary: string;
          example_quote: string;
          temporal_trend?: TemporalTrend;
        }>;
        what: Array<{
          topic: string;
          importance: string;
          percentage: string;
          summary: string;
          example_quote: string;
          temporal_trend?: TemporalTrend;
        }>;
        where: Array<{
          topic: string;
          importance: string;
          percentage: string;
          summary: string;
          example_quote: string;
          temporal_trend?: TemporalTrend;
        }>;
        when: Array<{
          topic: string;
          importance: string;
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

const getImportanceColor = (importance: string) => {
  switch (importance.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getSectionIcon = (section: string) => {
  switch (section) {
    case "who":
      return <Users className="h-5 w-5" />;
    case "what":
      return <Package className="h-5 w-5" />;
    case "where":
      return <MapPin className="h-5 w-5" />;
    case "when":
      return <Clock className="h-5 w-5" />;
    default:
      return <Grid3X3 className="h-5 w-5" />;
  }
};

const getSectionTitle = (section: string) => {
  switch (section) {
    case "who":
      return "WHO is buying/using";
    case "what":
      return "WHAT the product is used as";
    case "where":
      return "WHERE it is used";
    case "when":
      return "WHEN it is used/purchased";
    default:
      return section.toUpperCase();
  }
};

const getSectionDescription = (section: string) => {
  switch (section) {
    case "who":
      return "Customer demographics and user types";
    case "what":
      return "Product use cases and purposes";
    case "where":
      return "Usage locations and environments";
    case "when":
      return "Purchase timing and usage occasions";
    default:
      return "";
  }
};

export function FourWMatrix({ analysis }: FourWMatrixProps) {
  if (!analysis || analysis.status !== "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Grid3X3 className="h-5 w-5 mr-2" />
            4W Matrix Analysis
          </CardTitle>
          <CardDescription>
            WHO, WHAT, WHERE, and WHEN insights from customer reviews
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

  const data = analysis.data?.four_w_matrix;

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Grid3X3 className="h-5 w-5 mr-2" />
            4W Matrix Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No 4W matrix data available.</p>
        </CardContent>
      </Card>
    );
  }

  const sections = ["who", "what", "where", "when"] as const;

  return (
    <div className="space-y-6">
      {/* Charts Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Grid3X3 className="h-5 w-5 mr-2" />
            4W Matrix Overview
          </CardTitle>
          <CardDescription>
            Visual breakdown of WHO, WHAT, WHERE, and WHEN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FourWChart data={data} />
        </CardContent>
      </Card>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section) => {
          const sectionData = data[section];
          if (!sectionData || sectionData.length === 0) return null;

          // Filter out topics with percentage < 1%
          const filteredData = sectionData.filter((item: any) => {
            if (!item.percentage) return true; // Keep topics without percentage
            const value = parseFloat(item.percentage.replace('%', ''));
            return value >= 1; // Only keep topics with 1% or higher
          });

          return (
            <Card key={section}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getSectionIcon(section)}
                  <span className="ml-2">{getSectionTitle(section)}</span>
                </CardTitle>
                <CardDescription>
                  {getSectionDescription(section)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredData.map((item, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{item.topic}</h4>
                          {item.temporal_trend && (
                            <TrendIndicator 
                              status={item.temporal_trend.status} 
                              timeline={item.temporal_trend.timeline}
                              size="sm"
                            />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
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
                          {item.importance && (
                            <BadgeTooltip type="importance" value={item.importance}>
                              <Badge className={getImportanceColor(item.importance)}>
                                {item.importance}
                              </Badge>
                            </BadgeTooltip>
                          )}
                          {item.percentage && (
                            <BadgeTooltip type="percentage" value={item.percentage}>
                              <Badge variant="outline">{item.percentage}</Badge>
                            </BadgeTooltip>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-3">
                        {item.summary}
                      </p>
                      {item.temporal_trend && item.temporal_trend.trend_summary && (
                        <div className="text-sm text-gray-600 mb-3 italic">
                          <strong>Over Time:</strong> {item.temporal_trend.trend_summary}
                          {item.temporal_trend.last_mentioned && item.temporal_trend.status === 'RESOLVED' && (
                            <span className="ml-2 text-green-600">
                              (Last mentioned: {item.temporal_trend.last_mentioned})
                            </span>
                          )}
                        </div>
                      )}
                      {item.example_quote && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <Quote className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-blue-800 italic text-sm">
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
    </div>
  );
}
