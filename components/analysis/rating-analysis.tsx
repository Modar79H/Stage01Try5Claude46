"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Star, AlertCircle } from "lucide-react";
import { RatingChart } from "../charts/rating-chart";

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
            frequency: number;
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
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <RatingChart data={ratingData} />
          </div>

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

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2 text-[#104862]">
              Key Insights
            </h3>
            <p className="text-gray-700">{ratingData.insights.summary}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
