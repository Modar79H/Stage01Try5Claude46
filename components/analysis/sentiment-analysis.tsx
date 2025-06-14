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
        }>;
        customer_dislikes: Array<{
          theme: string;
          importance: string;
          percentage: string;
          summary: string;
          example_quote: string;
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

  const data = analysis.data.sentiment_analysis;

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
              {data.customer_likes.map((like, index) => (
                <div key={index} className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-lg">{like.theme}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge className={getImportanceColor(like.importance)}>
                        {like.importance}
                      </Badge>
                      <Badge variant="outline">{like.percentage}</Badge>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{like.summary}</p>
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
              {data.customer_dislikes.map((dislike, index) => (
                <div key={index} className="border-l-4 border-red-500 pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-lg">{dislike.theme}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge className={getImportanceColor(dislike.importance)}>
                        {dislike.importance}
                      </Badge>
                      <Badge variant="outline">{dislike.percentage}</Badge>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{dislike.summary}</p>
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
