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
} from "lucide-react";

interface SWOTAnalysisProps {
  analysis?: {
    data: {
      swot_analysis?: {
        strengths: Array<{
          topic: string;
          percentage: string;
          summary: string;
          example_quote: string;
        }>;
        weaknesses: Array<{
          topic: string;
          percentage: string;
          summary: string;
          example_quote: string;
        }>;
        opportunities: Array<{
          topic: string;
          percentage: string;
          summary: string;
          example_quote: string;
        }>;
        threats: Array<{
          topic: string;
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
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            SWOT Analysis
          </CardTitle>
          <CardDescription>
            Strengths, Weaknesses, Opportunities, and Threats analysis
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

  const data = analysis.data.swot_analysis;

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            SWOT Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No SWOT analysis data available.</p>
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
      {/* SWOT Framework Overview */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">
            SWOT Analysis Framework
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-800">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-100 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800">Strengths</h3>
              <p className="text-sm text-green-700">Internal Positive</p>
            </div>
            <div className="text-center p-4 bg-red-100 rounded-lg">
              <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <h3 className="font-semibold text-red-800">Weaknesses</h3>
              <p className="text-sm text-red-700">Internal Negative</p>
            </div>
            <div className="text-center p-4 bg-blue-100 rounded-lg">
              <Lightbulb className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-800">Opportunities</h3>
              <p className="text-sm text-blue-700">External Positive</p>
            </div>
            <div className="text-center p-4 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-orange-800">Threats</h3>
              <p className="text-sm text-orange-700">External Negative</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
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
                <CardTitle
                  className={`flex items-center ${categoryInfo.color}`}
                >
                  {categoryInfo.icon}
                  <span className="ml-2">{categoryInfo.title}</span>
                </CardTitle>
                <CardDescription>{categoryInfo.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.data.map((item, index) => (
                    <div
                      key={index}
                      className={`border-l-4 ${categoryInfo.borderColor} pl-4`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{item.topic}</h4>
                        <Badge className={categoryInfo.badgeColor}>
                          {item.percentage}
                        </Badge>
                      </div>
                      <p className="text-gray-700 text-sm mb-3">
                        {item.summary}
                      </p>
                      {item.example_quote && (
                        <div
                          className={`${categoryInfo.bgColor} border ${categoryInfo.borderColor} rounded-lg p-3`}
                        >
                          <div className="flex items-start space-x-2">
                            <Quote
                              className={`h-4 w-4 mt-0.5 flex-shrink-0 ${categoryInfo.color}`}
                            />
                            <p
                              className={`italic text-sm ${categoryInfo.color}`}
                            >
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
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-900">
            Strategic Implications
          </CardTitle>
        </CardHeader>
        <CardContent className="text-purple-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Leverage Strengths</h4>
              <p className="text-sm">
                Use your strengths to capitalize on opportunities and defend
                against threats.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Address Weaknesses</h4>
              <p className="text-sm">
                Improve weaknesses to better compete and reduce vulnerability to
                threats.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Pursue Opportunities</h4>
              <p className="text-sm">
                Develop strategies to take advantage of external opportunities.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Mitigate Threats</h4>
              <p className="text-sm">
                Create defensive strategies to minimize the impact of external
                threats.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
