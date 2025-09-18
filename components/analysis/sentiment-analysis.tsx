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
import { ThumbsUp, ThumbsDown, AlertCircle, Quote, Heart, TrendingUp, Lightbulb } from "lucide-react";
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

const getSentimentInfo = (type: string) => {
  switch (type) {
    case "likes":
      return {
        icon: <ThumbsUp className="h-5 w-5" />,
        title: "What Customers Love",
        description: "Positive themes driving satisfaction",
        color: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-500",
        badgeColor: "bg-green-100 text-green-800",
        gradientColors: "from-green-500 to-emerald-500",
      };
    case "dislikes":
      return {
        icon: <ThumbsDown className="h-5 w-5" />,
        title: "Areas for Improvement",
        description: "Concerns requiring attention",
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-500",
        badgeColor: "bg-red-100 text-red-800",
        gradientColors: "from-red-500 to-pink-500",
      };
    default:
      return {
        icon: <Heart className="h-5 w-5" />,
        title: "Sentiment",
        description: "",
        color: "text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-500",
        badgeColor: "bg-gray-100 text-gray-800",
        gradientColors: "from-gray-500 to-gray-600",
      };
  }
};

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
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 mr-3">
              <Heart className="h-5 w-5 text-white" />
            </div>
            Sentiment Analysis
          </CardTitle>
          <CardDescription>
            Customer satisfaction insights from reviews
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

  const data = analysis.data?.sentiment_analysis;

  if (
    !data ||
    (!data.customer_likes?.length && !data.customer_dislikes?.length)
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 mr-3">
              <Heart className="h-5 w-5 text-white" />
            </div>
            Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">No sentiment data available.</p>
        </CardContent>
      </Card>
    );
  }

  const sentimentCategories = [
    { key: "likes", data: data.customer_likes || [] },
    { key: "dislikes", data: data.customer_dislikes || [] },
  ];

  return (
    <div className="space-y-6">
      {/* Charts Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 mr-3">
              <Heart className="h-5 w-5 text-white" />
            </div>
            Sentiment Distribution
          </CardTitle>
          <CardDescription>
            Visual breakdown of customer sentiment themes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SentimentChart
            likes={data.customer_likes || []}
            dislikes={data.customer_dislikes || []}
          />
        </CardContent>
      </Card>

      {/* Detailed Sentiment Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sentimentCategories.map((category) => {
          if (!category.data || category.data.length === 0) return null;

          const categoryInfo = getSentimentInfo(category.key);

          return (
            <Card key={category.key}>
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-r ${categoryInfo.gradientColors} mr-3`}
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
                      if (!item.percentage) return true;
                      const value = parseFloat(item.percentage.replace('%', ''));
                      return value >= 1;
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
                            {item.theme}
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
                          {item.importance && (
                            <BadgeTooltip type="importance" value={item.importance}>
                              <Badge className={getImportanceColor(item.importance)} size="sm">
                                {item.importance}
                              </Badge>
                            </BadgeTooltip>
                          )}
                          <BadgeTooltip type="percentage" value={item.percentage}>
                            <Badge
                              variant={category.key === "likes" ? "success" : "destructive"}
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
            Sentiment Strategy
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
                  Amplify Positives
                </h4>
              </div>
              <ul className="text-sm space-y-2">
                {data.customer_likes &&
                  data.customer_likes.slice(0, 2).map((like, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-indigo-800 dark:text-indigo-200">
                        Emphasize {like.theme.toLowerCase()} in marketing messages
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20 dark:border-gray-700/20 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center mr-3">
                  <ThumbsDown className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-100">
                  Address Concerns
                </h4>
              </div>
              <ul className="text-sm space-y-2">
                {data.customer_dislikes &&
                  data.customer_dislikes.slice(0, 2).map((dislike, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-indigo-800 dark:text-indigo-200">
                        Improve {dislike.theme.toLowerCase()} through targeted initiatives
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
