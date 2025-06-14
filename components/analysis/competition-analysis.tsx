// components/analysis/competition-analysis.tsx
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
  Swords,
  AlertCircle,
  CheckCircle,
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
} from "lucide-react";

interface CompetitionAnalysisProps {
  analysis?: {
    data: {
      competition_analysis?: {
        comparison_matrix: Array<{
          feature: string;
          user_brand: string;
          competitor_1: string;
          competitor_2: string;
        }>;
        usps: {
          user_brand: string;
          competitor_1: string;
          competitor_2: string;
        };
        pain_points: {
          user_brand: string;
          competitor_1: string;
          competitor_2: string;
        };
        customer_segment_analysis: {
          user_brand: string;
          competitor_1: string;
          competitor_2: string;
        };
        loyalty_indicators: {
          user_brand: string;
          competitor_1: string;
          competitor_2: string;
        };
        price_value_perception: {
          price_sensitivity_mentions: {
            user_brand: string;
            competitor_1: string;
            competitor_2: string;
          };
          willingness_to_pay: {
            user_brand: string;
            competitor_1: string;
            competitor_2: string;
          };
        };
      };
    };
    status: string;
    error?: string;
  };
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "✅":
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case "❌":
      return <X className="h-5 w-5 text-red-600" />;
    case "⚠️":
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-gray-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "✅":
      return "bg-green-50 text-green-800";
    case "❌":
      return "bg-red-50 text-red-800";
    case "⚠️":
      return "bg-yellow-50 text-yellow-800";
    default:
      return "bg-gray-50 text-gray-800";
  }
};

export function CompetitionAnalysis({ analysis }: CompetitionAnalysisProps) {
  if (!analysis || analysis.status !== "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Swords className="h-5 w-5 mr-2" />
            Competition Analysis
          </CardTitle>
          <CardDescription>
            Competitive landscape analysis and positioning insights
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

  const data = analysis.data.competition_analysis;

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Swords className="h-5 w-5 mr-2" />
            Competition Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            No competition analysis data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feature Comparison Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Swords className="h-5 w-5 mr-2" />
            Feature Comparison Matrix
          </CardTitle>
          <CardDescription>
            Side-by-side comparison of key features and capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.comparison_matrix && data.comparison_matrix.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left font-semibold">
                      Feature
                    </th>
                    <th className="border border-gray-300 p-3 text-center font-semibold text-blue-700">
                      Your Brand
                    </th>
                    <th className="border border-gray-300 p-3 text-center font-semibold text-orange-700">
                      Competitor 1
                    </th>
                    <th className="border border-gray-300 p-3 text-center font-semibold text-purple-700">
                      Competitor 2
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.comparison_matrix.map((row, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="border border-gray-300 p-3 font-medium">
                        {row.feature}
                      </td>
                      <td
                        className={`border border-gray-300 p-3 text-center ${getStatusColor(row.user_brand)}`}
                      >
                        <div className="flex items-center justify-center">
                          {getStatusIcon(row.user_brand)}
                        </div>
                      </td>
                      <td
                        className={`border border-gray-300 p-3 text-center ${getStatusColor(row.competitor_1)}`}
                      >
                        <div className="flex items-center justify-center">
                          {getStatusIcon(row.competitor_1)}
                        </div>
                      </td>
                      <td
                        className={`border border-gray-300 p-3 text-center ${getStatusColor(row.competitor_2)}`}
                      >
                        <div className="flex items-center justify-center">
                          {getStatusIcon(row.competitor_2)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">
              No feature comparison data available.
            </p>
          )}
        </CardContent>
      </Card>

      {/* USPs Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-green-700">
            <TrendingUp className="h-5 w-5 mr-2" />
            Unique Selling Propositions
          </CardTitle>
          <CardDescription>
            Key differentiators and unique value propositions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-blue-700 mb-2">Your Brand</h4>
              <p className="text-gray-700 text-sm">{data.usps.user_brand}</p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-semibold text-orange-700 mb-2">
                Competitor 1
              </h4>
              <p className="text-gray-700 text-sm">{data.usps.competitor_1}</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold text-purple-700 mb-2">
                Competitor 2
              </h4>
              <p className="text-gray-700 text-sm">{data.usps.competitor_2}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pain Points Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-700">
            <TrendingDown className="h-5 w-5 mr-2" />
            Pain Points Analysis
          </CardTitle>
          <CardDescription>
            Customer complaints and areas for improvement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-blue-700 mb-2">Your Brand</h4>
              <p className="text-gray-700 text-sm">
                {data.pain_points.user_brand}
              </p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-semibold text-orange-700 mb-2">
                Competitor 1
              </h4>
              <p className="text-gray-700 text-sm">
                {data.pain_points.competitor_1}
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold text-purple-700 mb-2">
                Competitor 2
              </h4>
              <p className="text-gray-700 text-sm">
                {data.pain_points.competitor_2}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Segment Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Customer Segment Analysis
          </CardTitle>
          <CardDescription>
            Who buys what and customer base comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-700 mb-2">Your Brand</h4>
              <p className="text-blue-800 text-sm">
                {data.customer_segment_analysis.user_brand}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-700 mb-2">
                Competitor 1
              </h4>
              <p className="text-orange-800 text-sm">
                {data.customer_segment_analysis.competitor_1}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-700 mb-2">
                Competitor 2
              </h4>
              <p className="text-purple-800 text-sm">
                {data.customer_segment_analysis.competitor_2}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loyalty Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Customer Loyalty Indicators
          </CardTitle>
          <CardDescription>
            Repeat purchase behavior and customer retention signals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-lg">
                <Badge className="bg-blue-100 text-blue-800 mb-2">
                  Your Brand
                </Badge>
                <p className="text-gray-700 text-sm">
                  {data.loyalty_indicators.user_brand}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <Badge className="bg-orange-100 text-orange-800 mb-2">
                  Competitor 1
                </Badge>
                <p className="text-gray-700 text-sm">
                  {data.loyalty_indicators.competitor_1}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <Badge className="bg-purple-100 text-purple-800 mb-2">
                  Competitor 2
                </Badge>
                <p className="text-gray-700 text-sm">
                  {data.loyalty_indicators.competitor_2}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price-Value Perception */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Price-Value Perception Analysis
          </CardTitle>
          <CardDescription>
            Customer pricing sensitivity and value perception
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Price Sensitivity */}
          <div>
            <h4 className="font-semibold mb-4">Price Sensitivity Mentions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <h5 className="font-medium text-blue-800 mb-1">Your Brand</h5>
                <p className="text-blue-700 text-sm">
                  {
                    data.price_value_perception.price_sensitivity_mentions
                      .user_brand
                  }
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                <h5 className="font-medium text-orange-800 mb-1">
                  Competitor 1
                </h5>
                <p className="text-orange-700 text-sm">
                  {
                    data.price_value_perception.price_sensitivity_mentions
                      .competitor_1
                  }
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                <h5 className="font-medium text-purple-800 mb-1">
                  Competitor 2
                </h5>
                <p className="text-purple-700 text-sm">
                  {
                    data.price_value_perception.price_sensitivity_mentions
                      .competitor_2
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Willingness to Pay */}
          <div>
            <h4 className="font-semibold mb-4">Willingness to Pay</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <h5 className="font-medium text-green-800 mb-1">Your Brand</h5>
                <p className="text-green-700 text-sm">
                  {data.price_value_perception.willingness_to_pay.user_brand}
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <h5 className="font-medium text-yellow-800 mb-1">
                  Competitor 1
                </h5>
                <p className="text-yellow-700 text-sm">
                  {data.price_value_perception.willingness_to_pay.competitor_1}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <h5 className="font-medium text-red-800 mb-1">Competitor 2</h5>
                <p className="text-red-700 text-sm">
                  {data.price_value_perception.willingness_to_pay.competitor_2}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitive Strategy Insights */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">
            Competitive Strategy Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                Competitive Advantages
              </h4>
              <p className="text-sm">
                Leverage your unique strengths and differentiators to maintain
                market position.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                Areas for Improvement
              </h4>
              <p className="text-sm">
                Address gaps where competitors outperform to strengthen market
                position.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center">
                <Users className="h-4 w-4 mr-2 text-blue-600" />
                Market Positioning
              </h4>
              <p className="text-sm">
                Identify underserved segments and positioning opportunities in
                the competitive landscape.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-purple-600" />
                Pricing Strategy
              </h4>
              <p className="text-sm">
                Optimize pricing based on value perception relative to
                competitive alternatives.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
