// components/analysis/strategic-recommendations.tsx
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
  Lightbulb,
  AlertCircle,
  Package,
  Megaphone,
  Users,
  Zap,
  Clock,
  ArrowUp,
  ArrowRight,
  ArrowDown,
} from "lucide-react";

interface Recommendation {
  recommendation: string;
  priority_level: string;
  timeframe: string;
  introduction: string;
  supporting_evidence: string;
  expected_impact: string;
  implementation_considerations: string;
}

interface StrategicRecommendationsProps {
  analysis?: {
    data: {
      strategic_recommendations?: {
        executive_summary: string;
        product_strategy: Recommendation[];
        marketing_strategy: Recommendation[];
        customer_experience: Recommendation[];
        competitive_strategy: Recommendation[];
      };
    };
    status: string;
    error?: string;
  };
}

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "high":
      return <ArrowUp className="h-4 w-4" />;
    case "medium":
      return <ArrowRight className="h-4 w-4" />;
    case "low":
      return <ArrowDown className="h-4 w-4" />;
    default:
      return <ArrowRight className="h-4 w-4" />;
  }
};

const getTimeframeColor = (timeframe: string) => {
  switch (timeframe.toLowerCase()) {
    case "short-term":
      return "bg-blue-100 text-blue-800";
    case "medium-term":
      return "bg-purple-100 text-purple-800";
    case "long-term":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getCategoryInfo = (category: string) => {
  switch (category) {
    case "product_strategy":
      return {
        icon: <Package className="h-5 w-5" />,
        title: "Product Strategy",
        description:
          "Feature enhancements, quality improvements, and product positioning",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-500",
      };
    case "marketing_strategy":
      return {
        icon: <Megaphone className="h-5 w-5" />,
        title: "Marketing Strategy",
        description:
          "Target audience, messaging, channels, and content approaches",
        color: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-500",
      };
    case "customer_experience":
      return {
        icon: <Users className="h-5 w-5" />,
        title: "Customer Experience",
        description:
          "Journey improvements, touchpoint enhancements, and service strategies",
        color: "text-purple-700",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-500",
      };
    case "competitive_strategy":
      return {
        icon: <Zap className="h-5 w-5" />,
        title: "Competitive Strategy",
        description:
          "Differentiation, defensive tactics, and competitive advantages",
        color: "text-orange-700",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-500",
      };
    default:
      return {
        icon: <Lightbulb className="h-5 w-5" />,
        title: "Strategy",
        description: "",
        color: "text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-500",
      };
  }
};

export function StrategicRecommendations({
  analysis,
}: StrategicRecommendationsProps) {
  if (!analysis || analysis.status !== "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            Strategic Recommendations
          </CardTitle>
          <CardDescription>
            Actionable insights for product, marketing, and competitive strategy
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

  const data = analysis.data?.strategic_recommendations;

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            Strategic Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            No strategic recommendations available.
          </p>
        </CardContent>
      </Card>
    );
  }

  const strategyCategories = [
    { key: "product_strategy", data: data.product_strategy || [] },
    { key: "marketing_strategy", data: data.marketing_strategy || [] },
    { key: "customer_experience", data: data.customer_experience || [] },
    { key: "competitive_strategy", data: data.competitive_strategy || [] },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <Lightbulb className="h-6 w-6 mr-2" />
            Executive Summary
          </CardTitle>
          <CardDescription className="text-blue-700">
            Key insights and highest-impact recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800 leading-relaxed text-lg">
            {data.executive_summary}
          </p>
        </CardContent>
      </Card>

      {/* Strategic Categories */}
      {strategyCategories.map((category) => {
        if (!category.data || category.data.length === 0) return null;

        const categoryInfo = getCategoryInfo(category.key);

        return (
          <Card key={category.key}>
            <CardHeader>
              <CardTitle className={`flex items-center ${categoryInfo.color}`}>
                {categoryInfo.icon}
                <span className="ml-2">{categoryInfo.title}</span>
              </CardTitle>
              <CardDescription>{categoryInfo.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {category.data.map((recommendation, index) => (
                  <div
                    key={index}
                    className={`border-l-4 ${categoryInfo.borderColor} pl-6 ${categoryInfo.bgColor} p-4 rounded-r-lg`}
                  >
                    {/* Header with priority and timeframe */}
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-base pr-4">
                        {recommendation.recommendation}
                      </h4>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Badge
                          className={`${getPriorityColor(recommendation.priority_level)} flex items-center space-x-1`}
                        >
                          {getPriorityIcon(recommendation.priority_level)}
                          <span>{recommendation.priority_level}</span>
                        </Badge>
                        <Badge
                          className={`${getTimeframeColor(recommendation.timeframe)} flex items-center space-x-1`}
                        >
                          <Clock className="h-3 w-3" />
                          <span>{recommendation.timeframe}</span>
                        </Badge>
                      </div>
                    </div>

                    {/* Introduction */}
                    <p className={`${categoryInfo.color} mb-4 italic`}>
                      {recommendation.introduction}
                    </p>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg border">
                        <h5 className="font-medium text-gray-900 mb-2">
                          Supporting Evidence
                        </h5>
                        <p className="text-gray-700 text-sm">
                          {recommendation.supporting_evidence}
                        </p>
                      </div>

                      <div className="bg-white p-3 rounded-lg border">
                        <h5 className="font-medium text-gray-900 mb-2">
                          Expected Impact
                        </h5>
                        <p className="text-gray-700 text-sm">
                          {recommendation.expected_impact}
                        </p>
                      </div>
                    </div>

                    {/* Implementation Considerations */}
                    <div className="mt-4 bg-white p-3 rounded-lg border">
                      <h5 className="font-medium text-gray-900 mb-2">
                        Implementation Considerations
                      </h5>
                      <p className="text-gray-700 text-sm">
                        {recommendation.implementation_considerations}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Implementation Roadmap */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-900">
            Implementation Roadmap
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center">
                <Badge className="bg-blue-100 text-blue-800 mr-2">1</Badge>
                Short-term (0-3 months)
              </h4>
              <p className="text-sm">
                Focus on high-priority, quick-win initiatives that can show
                immediate impact.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center">
                <Badge className="bg-purple-100 text-purple-800 mr-2">2</Badge>
                Medium-term (3-12 months)
              </h4>
              <p className="text-sm">
                Implement strategic initiatives that require more planning and
                resources.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center">
                <Badge className="bg-indigo-100 text-indigo-800 mr-2">3</Badge>
                Long-term (12+ months)
              </h4>
              <p className="text-sm">
                Execute transformational changes and major strategic shifts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
