// components/analysis/customer-journey.tsx
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
  Map,
  AlertCircle,
  Quote,
  Eye,
  Search,
  ShoppingCart,
  Truck,
  Star,
  MessageCircle,
} from "lucide-react";

interface CustomerJourneyProps {
  analysis?: {
    data: {
      customer_journey?: {
        awareness: Array<{
          topic: string;
          percentage: string;
          summary: string;
          example_quote: string;
        }>;
        consideration: Array<{
          topic: string;
          percentage: string;
          summary: string;
          example_quote: string;
        }>;
        purchase: Array<{
          topic: string;
          percentage: string;
          summary: string;
          example_quote: string;
        }>;
        delivery_unboxing: Array<{
          topic: string;
          percentage: string;
          summary: string;
          example_quote: string;
        }>;
        usage: Array<{
          topic: string;
          percentage: string;
          summary: string;
          example_quote: string;
        }>;
        post_purchase: Array<{
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

const getStageInfo = (stage: string) => {
  switch (stage) {
    case "awareness":
      return {
        icon: <Eye className="h-5 w-5" />,
        title: "Awareness",
        description: "How customers first discover the product",
        color: "text-purple-700",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-500",
      };
    case "consideration":
      return {
        icon: <Search className="h-5 w-5" />,
        title: "Consideration",
        description: "Research phase and decision factors",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-500",
      };
    case "purchase":
      return {
        icon: <ShoppingCart className="h-5 w-5" />,
        title: "Purchase",
        description: "Buying process and transaction experience",
        color: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-500",
      };
    case "delivery_unboxing":
      return {
        icon: <Truck className="h-5 w-5" />,
        title: "Delivery & Unboxing",
        description: "Receiving and first impressions",
        color: "text-orange-700",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-500",
      };
    case "usage":
      return {
        icon: <Star className="h-5 w-5" />,
        title: "Usage",
        description: "Product experience and satisfaction",
        color: "text-yellow-700",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-500",
      };
    case "post_purchase":
      return {
        icon: <MessageCircle className="h-5 w-5" />,
        title: "Post-Purchase",
        description: "Advocacy, returns, and repeat purchases",
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-500",
      };
    default:
      return {
        icon: <Map className="h-5 w-5" />,
        title: stage,
        description: "",
        color: "text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-500",
      };
  }
};

export function CustomerJourney({ analysis }: CustomerJourneyProps) {
  if (!analysis || analysis.status !== "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Map className="h-5 w-5 mr-2" />
            Customer Journey Mapping
          </CardTitle>
          <CardDescription>
            Complete customer experience from awareness to post-purchase
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

  const data = analysis.data.customer_journey;

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Map className="h-5 w-5 mr-2" />
            Customer Journey Mapping
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No customer journey data available.</p>
        </CardContent>
      </Card>
    );
  }

  const journeyStages = [
    { key: "awareness", data: data.awareness || [] },
    { key: "consideration", data: data.consideration || [] },
    { key: "purchase", data: data.purchase || [] },
    { key: "delivery_unboxing", data: data.delivery_unboxing || [] },
    { key: "usage", data: data.usage || [] },
    { key: "post_purchase", data: data.post_purchase || [] },
  ];

  return (
    <div className="space-y-6">
      {/* Journey Overview */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">
            Customer Journey Stages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
            {journeyStages.map((stage, index) => {
              const stageInfo = getStageInfo(stage.key);
              return (
                <div key={stage.key} className="flex items-center">
                  <div className="text-center">
                    <div
                      className={`w-12 h-12 rounded-full ${stageInfo.bgColor} ${stageInfo.borderColor} border-2 flex items-center justify-center ${stageInfo.color} mb-2`}
                    >
                      {stageInfo.icon}
                    </div>
                    <p className="text-sm font-semibold">{stageInfo.title}</p>
                  </div>
                  {index < journeyStages.length - 1 && (
                    <div className="hidden md:block w-8 h-0.5 bg-gray-300 ml-4"></div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Journey Stages */}
      <div className="space-y-6">
        {journeyStages.map((stage) => {
          if (!stage.data || stage.data.length === 0) return null;

          const stageInfo = getStageInfo(stage.key);

          return (
            <Card key={stage.key}>
              <CardHeader>
                <CardTitle className={`flex items-center ${stageInfo.color}`}>
                  {stageInfo.icon}
                  <span className="ml-2">{stageInfo.title}</span>
                </CardTitle>
                <CardDescription>{stageInfo.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stage.data.map((item, index) => (
                    <div
                      key={index}
                      className={`border-l-4 ${stageInfo.borderColor} pl-4`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{item.topic}</h4>
                        <Badge variant="outline">{item.percentage}</Badge>
                      </div>
                      <p className="text-gray-700 text-sm mb-3">
                        {item.summary}
                      </p>
                      {item.example_quote && (
                        <div
                          className={`${stageInfo.bgColor} border ${stageInfo.borderColor} rounded-lg p-3`}
                        >
                          <div className="flex items-start space-x-2">
                            <Quote
                              className={`h-4 w-4 mt-0.5 flex-shrink-0 ${stageInfo.color}`}
                            />
                            <p className={`italic text-sm ${stageInfo.color}`}>
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

      {/* Journey Insights */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Key Journey Insights</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Critical Touchpoints</h4>
              <p className="text-sm">
                Focus on moments that most impact customer decisions and
                satisfaction.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Pain Point Patterns</h4>
              <p className="text-sm">
                Address recurring friction points across multiple journey
                stages.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Opportunity Moments</h4>
              <p className="text-sm">
                Identify stages where positive experiences can drive loyalty and
                advocacy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
