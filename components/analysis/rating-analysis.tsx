"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Quote,
} from "lucide-react";
import { RatingChart } from "../charts/rating-chart";
import { TemporalBadge, TrendIndicator } from "@/components/temporal";
import { TemporalTrend } from "@/lib/types/temporal";
import { BadgeTooltip } from "./BadgeTooltip";

interface RatingAnalysisProps {
  analysis: {
    status: string;
    error?: string;
    data?: {
      rating_analysis?: {
        ratings: Array<{
          rating: number;
          count: number;
          percentage: string;
          top_themes: Array<{
            theme: string;
            frequency: string;
            temporal_trend?: TemporalTrend;
          }>;
        }>;
        insights: {
          highest_rated_aspects: string[];
          lowest_rated_aspects: string[];
          summary: string;
        };
      };
    };
  };
}

const getRatingInfo = (type: string) => {
  switch (type) {
    case "highest":
      return {
        icon: <TrendingUp className="h-5 w-5" />,
        title: "Highest Rated Aspects",
        description: "Strengths customers consistently praise",
        color: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-500",
        badgeColor: "bg-green-100 text-green-800",
        gradientColors: "from-green-500 to-emerald-500",
      };
    case "lowest":
      return {
        icon: <TrendingDown className="h-5 w-5" />,
        title: "Lowest Rated Aspects",
        description: "Areas needing improvement",
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-500",
        badgeColor: "bg-red-100 text-red-800",
        gradientColors: "from-red-500 to-pink-500",
      };
    default:
      return {
        icon: <Star className="h-5 w-5" />,
        title: "Rating Analysis",
        description: "",
        color: "text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-500",
        badgeColor: "bg-gray-100 text-gray-800",
        gradientColors: "from-gray-500 to-gray-600",
      };
  }
};

export function RatingAnalysis({ analysis }: RatingAnalysisProps) {
  if (!analysis || analysis.status !== "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 mr-3">
              <Star className="h-5 w-5 text-white" />
            </div>
            Rating Analysis
          </CardTitle>
          <CardDescription>
            Customer rating distribution and insights
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

  const ratingData = analysis.data?.rating_analysis;
  if (!ratingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 mr-3">
              <Star className="h-5 w-5 text-white" />
            </div>
            Rating Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            No rating data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  const ratingCategories = [
    { key: "highest", data: ratingData.insights.highest_rated_aspects || [] },
    { key: "lowest", data: ratingData.insights.lowest_rated_aspects || [] },
  ];

  return (
    <div className="space-y-6">
      {/* Charts Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 mr-3">
              <Star className="h-5 w-5 text-white" />
            </div>
            Rating Distribution
          </CardTitle>
          <CardDescription>
            Visual breakdown of customer ratings and themes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RatingChart data={ratingData} />
        </CardContent>
      </Card>

      {/* Detailed Rating Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ratingCategories.map((category) => {
          if (!category.data || category.data.length === 0) return null;

          const categoryInfo = getRatingInfo(category.key);

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
                  {category.data.map((aspect, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-gradient-primary pl-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-r-lg p-4 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-base text-gray-900 dark:text-white">
                          {aspect}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Rating Themes Over Time */}
      {ratingData.ratings.some((rating) =>
        rating.top_themes.some((theme) => theme.temporal_trend),
      ) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 mr-3">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Rating Themes Over Time
            </CardTitle>
            <CardDescription>Temporal trends in rating themes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ratingData.ratings.map(
                (rating, ratingIndex) =>
                  rating.top_themes.filter((theme) => theme.temporal_trend)
                    .length > 0 && (
                    <div
                      key={ratingIndex}
                      className="border-l-4 border-gradient-primary pl-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-r-lg p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center">
                          {[...Array(rating.rating)].map((_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                          {[...Array(5 - rating.rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-gray-300" />
                          ))}
                        </div>
                        <Badge variant="outline" size="sm">
                          {rating.percentage} of reviews
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {rating.top_themes
                          .filter((theme) => theme.temporal_trend)
                          .map((theme, themeIndex) => (
                            <div
                              key={themeIndex}
                              className="flex items-center justify-between p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-base text-gray-900 dark:text-white">
                                  {theme.theme}
                                </span>
                                {theme.temporal_trend && (
                                  <TrendIndicator
                                    status={theme.temporal_trend.status}
                                    timeline={theme.temporal_trend.timeline}
                                    size="sm"
                                  />
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {theme.temporal_trend && (
                                  <BadgeTooltip
                                    type="trend"
                                    value={theme.temporal_trend.status}
                                    description={
                                      theme.temporal_trend.trend_summary
                                    }
                                  >
                                    <div>
                                      <TemporalBadge
                                        status={theme.temporal_trend.status}
                                        size="sm"
                                      />
                                    </div>
                                  </BadgeTooltip>
                                )}
                                <Badge variant="secondary" size="sm">
                                  {theme.frequency}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ),
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategic Implications */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
        <CardHeader>
          <CardTitle className="text-indigo-900 dark:text-indigo-100 flex items-center">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 mr-3">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            Rating Strategy
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
                  Amplify Strengths
                </h4>
              </div>
              <ul className="text-sm space-y-2">
                {ratingData.insights.highest_rated_aspects
                  .slice(0, 2)
                  .map((aspect, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-indigo-800 dark:text-indigo-200">
                        Highlight {aspect.toLowerCase()} in marketing
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
                {ratingData.insights.lowest_rated_aspects
                  .slice(0, 2)
                  .map((aspect, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-indigo-800 dark:text-indigo-200">
                        Improve {aspect.toLowerCase()} to boost ratings
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
