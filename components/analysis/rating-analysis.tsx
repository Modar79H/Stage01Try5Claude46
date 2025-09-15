"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Star, AlertCircle } from "lucide-react";
import { RatingChart } from "../charts/rating-chart";
import { TemporalBadge, TrendIndicator } from "@/components/temporal";
import { TemporalTrend } from "@/lib/types/temporal";

interface RatingAnalysisProps {
  analysis: {
    status: string;
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

export function RatingAnalysis({ analysis }: RatingAnalysisProps) {
  if (!analysis || analysis.status !== "completed") {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertCircle className="h-4 w-4 text-yellow-800" />
        <AlertDescription className="text-yellow-800">
          Rating analysis is not yet available. Please check back later.
        </AlertDescription>
      </Alert>
    );
  }

  const ratingData = analysis.data?.rating_analysis;
  if (!ratingData) {
    return (
      <Alert className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-800" />
        <AlertDescription className="text-red-800">
          Unable to load rating analysis data.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Star className="h-5 w-5 mr-2 text-[#E97132]" />
            Rating Distribution & Key Themes
          </CardTitle>
          <CardDescription>
            Visual representation of themes across different rating levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <RatingChart data={ratingData} />
          </div>

          {/* Rating Themes with Temporal Trends */}
          {ratingData.ratings.some(rating => rating.top_themes.some(theme => theme.temporal_trend)) && (
            <div className="mt-8 space-y-4">
              <h3 className="font-semibold text-lg text-[#104862] mb-4">
                Rating Themes Over Time
              </h3>
              {ratingData.ratings.map((rating, ratingIndex) => (
                rating.top_themes.filter(theme => theme.temporal_trend).length > 0 && (
                  <div key={ratingIndex} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center">
                        {[...Array(rating.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                        {[...Array(5 - rating.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-gray-300" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        ({rating.percentage} of reviews)
                      </span>
                    </div>
                    <div className="space-y-3">
                      {rating.top_themes.filter(theme => theme.temporal_trend).map((theme, themeIndex) => (
                        <div key={themeIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">{theme.theme}</span>
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
                              <TemporalBadge 
                                status={theme.temporal_trend.status} 
                                size="sm"
                              />
                            )}
                            <span className="text-sm text-gray-600">{theme.frequency}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-[#104862]">
                Highest Rated Aspects
              </h3>
              <ul className="space-y-2">
                {ratingData.insights.highest_rated_aspects.map(
                  (aspect, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span className="text-gray-700">{aspect}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 text-[#104862]">
                Lowest Rated Aspects
              </h3>
              <ul className="space-y-2">
                {ratingData.insights.lowest_rated_aspects.map(
                  (aspect, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      <span className="text-gray-700">{aspect}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
