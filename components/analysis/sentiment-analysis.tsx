// components/analysis/sentiment-analysis.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SentimentChart } from "@/components/charts/sentiment-chart";
import { ThumbsUp, ThumbsDown, AlertCircle, Quote } from "lucide-react";
import {
  TemporalBadge,
  TrendIndicator,
  TemporalTimeline,
} from "@/components/temporal";
import { TemporalTrend } from "@/lib/types/temporal";
import { BadgeTooltip } from "./BadgeTooltip";

interface SentimentAnalysisProps {
  analysis?: {
    data: {
      sentiment_analysis?: {
        customer_likes: Array<{
          theme: string;
          importance: string;
          percentage: string;
          summary: string;
          example_quote: string;
          temporal_trend?: TemporalTrend;
        }>;
        customer_dislikes: Array<{
          theme: string;
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

export function SentimentAnalysis({ analysis }: SentimentAnalysisProps) {
  if (!analysis || analysis.status !== "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ThumbsUp className="h-5 w-5 mr-2" />
            Sentiment Analysis
          </CardTitle>
          <CardDescription>
            Customer satisfaction insights from reviews
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

  const data = analysis.data?.sentiment_analysis;

  if (
    !data ||
    (!data.customer_likes?.length && !data.customer_dislikes?.length)
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ThumbsUp className="h-5 w-5 mr-2" />
            Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No sentiment data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ThumbsUp className="h-5 w-5 mr-2" />
            Sentiment Overview
          </CardTitle>
          <CardDescription>
            Visual representation of customer sentiment themes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SentimentChart
            likes={data.customer_likes || []}
            dislikes={data.customer_dislikes || []}
          />
        </CardContent>
      </Card>

      {/* Customer Likes */}
      {data.customer_likes && data.customer_likes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <ThumbsUp className="h-5 w-5 mr-2" />
              What Customers Love
            </CardTitle>
            <CardDescription>
              Positive themes from customer feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.customer_likes
                .filter((like: any) => {
                  if (!like.percentage) return true; // Keep topics without percentage
                  const value = parseFloat(like.percentage.replace('%', ''));
                  return value >= 1; // Only keep topics with 1% or higher
                })
                .sort((a: any, b: any) => {
                  const aValue = parseFloat(a.percentage?.replace('%', '') || '0');
                  const bValue = parseFloat(b.percentage?.replace('%', '') || '0');
                  return bValue - aValue;
                })
                .map((like, index) => (
                <div key={index} className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-lg">{like.theme}</h4>
                      {like.temporal_trend && (
                        <TrendIndicator
                          status={like.temporal_trend.status}
                          timeline={like.temporal_trend.timeline}
                          size="sm"
                        />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {like.temporal_trend && (
                        <BadgeTooltip 
                          type="trend" 
                          value={like.temporal_trend.status}
                          description={like.temporal_trend.trend_summary}
                        >
                          <TemporalBadge
                            status={like.temporal_trend.status}
                            size="sm"
                          />
                        </BadgeTooltip>
                      )}
                      {like.importance && (
                        <BadgeTooltip type="importance" value={like.importance}>
                          <Badge className={getImportanceColor(like.importance)}>
                            {like.importance}
                          </Badge>
                        </BadgeTooltip>
                      )}
                      <BadgeTooltip type="percentage" value={like.percentage}>
                        <Badge variant="outline">{like.percentage}</Badge>
                      </BadgeTooltip>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{like.summary}</p>
                  {like.temporal_trend && like.temporal_trend.trend_summary && (
                    <div className="text-sm text-gray-600 mb-3 italic">
                      <strong>Over Time:</strong>{" "}
                      {like.temporal_trend.trend_summary}
                      {like.temporal_trend.last_mentioned &&
                        like.temporal_trend.status === "RESOLVED" && (
                          <span className="ml-2 text-green-600">
                            (Last mentioned:{" "}
                            {like.temporal_trend.last_mentioned})
                          </span>
                        )}
                    </div>
                  )}
                  {like.example_quote && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <Quote className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-green-800 italic text-sm">
                          "{like.example_quote}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Dislikes */}
      {data.customer_dislikes && data.customer_dislikes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <ThumbsDown className="h-5 w-5 mr-2" />
              Areas for Improvement
            </CardTitle>
            <CardDescription>
              Negative themes and concerns from customer feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.customer_dislikes
                .filter((dislike: any) => {
                  if (!dislike.percentage) return true; // Keep topics without percentage
                  const value = parseFloat(dislike.percentage.replace('%', ''));
                  return value >= 1; // Only keep topics with 1% or higher
                })
                .sort((a: any, b: any) => {
                  const aValue = parseFloat(a.percentage?.replace('%', '') || '0');
                  const bValue = parseFloat(b.percentage?.replace('%', '') || '0');
                  return bValue - aValue;
                })
                .map((dislike, index) => (
                <div key={index} className="border-l-4 border-red-500 pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-lg">{dislike.theme}</h4>
                      {dislike.temporal_trend && (
                        <TrendIndicator
                          status={dislike.temporal_trend.status}
                          timeline={dislike.temporal_trend.timeline}
                          size="sm"
                        />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {dislike.temporal_trend && (
                        <BadgeTooltip 
                          type="trend" 
                          value={dislike.temporal_trend.status}
                          description={dislike.temporal_trend.trend_summary}
                        >
                          <div>
                            <TemporalBadge
                              status={dislike.temporal_trend.status}
                              size="sm"
                            />
                          </div>
                        </BadgeTooltip>
                      )}
                      {dislike.importance && (
                        <BadgeTooltip type="importance" value={dislike.importance}>
                          <Badge className={getImportanceColor(dislike.importance)}>
                            {dislike.importance}
                          </Badge>
                        </BadgeTooltip>
                      )}
                      <BadgeTooltip type="percentage" value={dislike.percentage}>
                        <Badge variant="outline">{dislike.percentage}</Badge>
                      </BadgeTooltip>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{dislike.summary}</p>
                  {dislike.temporal_trend &&
                    dislike.temporal_trend.trend_summary && (
                      <div className="text-sm text-gray-600 mb-3 italic">
                        <strong>Over Time:</strong>{" "}
                        {dislike.temporal_trend.trend_summary}
                        {dislike.temporal_trend.last_mentioned &&
                          dislike.temporal_trend.status === "RESOLVED" && (
                            <span className="ml-2 text-green-600">
                              (Last mentioned:{" "}
                              {dislike.temporal_trend.last_mentioned})
                            </span>
                          )}
                      </div>
                    )}
                  {dislike.example_quote && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <Quote className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-red-800 italic text-sm">
                          "{dislike.example_quote}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
