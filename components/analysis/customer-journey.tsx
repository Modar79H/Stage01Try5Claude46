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
        journey_table?: {
          awareness: {
            customer_actions: string;
            touchpoints: string;
            emotions: string;
            pain_points: string;
            opportunities: string;
          };
          consideration: {
            customer_actions: string;
            touchpoints: string;
            emotions: string;
            pain_points: string;
            opportunities: string;
          };
          purchase: {
            customer_actions: string;
            touchpoints: string;
            emotions: string;
            pain_points: string;
            opportunities: string;
          };
          delivery_unboxing: {
            customer_actions: string;
            touchpoints: string;
            emotions: string;
            pain_points: string;
            opportunities: string;
          };
          usage: {
            customer_actions: string;
            touchpoints: string;
            emotions: string;
            pain_points: string;
            opportunities: string;
          };
          post_purchase: {
            customer_actions: string;
            touchpoints: string;
            emotions: string;
            pain_points: string;
            opportunities: string;
          };
        };
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
      <Card variant="glass" hover>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 mr-3">
              <Map className="h-5 w-5 text-white" />
            </div>
            Customer Journey Mapping
          </CardTitle>
          <CardDescription>
            Complete customer experience from awareness to post-purchase
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
                <p className="text-gray-600 dark:text-gray-400">Analysis in progress...</p>
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
      <Card variant="glass" hover>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 mr-3">
              <Map className="h-5 w-5 text-white" />
            </div>
            Customer Journey Mapping
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">No customer journey data available.</p>
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
      {/* Journey Table Visualization */}
      {data.journey_table && (
        <Card variant="glass" hover>
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900 dark:text-white">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 mr-3">
                <Map className="h-5 w-5 text-white" />
              </div>
              Customer Journey Overview
            </CardTitle>
            <CardDescription>
              Comprehensive view of customer actions, touchpoints, emotions,
              pain points, and opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                    <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                      Stage
                    </th>
                    <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                      Customer Actions
                    </th>
                    <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                      Touchpoints
                    </th>
                    <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                      Emotions
                    </th>
                    <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                      Pain Points
                    </th>
                    <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                      Opportunities
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {journeyStages.map((stage) => {
                    const stageInfo = getStageInfo(stage.key);
                    const stageData =
                      data.journey_table[
                        stage.key as keyof typeof data.journey_table
                      ];
                    if (!stageData) return null;

                    return (
                      <tr key={stage.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="border border-gray-200 dark:border-gray-600 px-4 py-3">
                          <div className="flex items-center">
                            <div className={`${stageInfo.color} mr-2`}>
                              {stageInfo.icon}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {stageInfo.title}
                            </span>
                          </div>
                        </td>
                        <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {stageData.customer_actions}
                        </td>
                        <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {stageData.touchpoints}
                        </td>
                        <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {stageData.emotions}
                        </td>
                        <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                          {stageData.pain_points}
                        </td>
                        <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                          {stageData.opportunities}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Journey Overview */}
      <Card variant="gradient" className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
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
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center mb-3 hover:scale-105 transition-transform duration-200">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stageInfo.color.includes('purple') ? 'from-purple-500 to-pink-500' : stageInfo.color.includes('blue') ? 'from-blue-500 to-indigo-500' : stageInfo.color.includes('green') ? 'from-green-500 to-emerald-500' : stageInfo.color.includes('orange') ? 'from-orange-500 to-red-500' : stageInfo.color.includes('yellow') ? 'from-yellow-500 to-orange-500' : 'from-red-500 to-pink-500'} flex items-center justify-center`}>
                        <div className="text-white">
                          {stageInfo.icon}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{stageInfo.title}</p>
                  </div>
                  {index < journeyStages.length - 1 && (
                    <div className="hidden md:block w-8 h-0.5 bg-gradient-to-r from-blue-300 to-indigo-300 ml-4"></div>
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
            <Card key={stage.key} variant="glass" hover>
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${stageInfo.color.includes('purple') ? 'from-purple-500 to-pink-500' : stageInfo.color.includes('blue') ? 'from-blue-500 to-indigo-500' : stageInfo.color.includes('green') ? 'from-green-500 to-emerald-500' : stageInfo.color.includes('orange') ? 'from-orange-500 to-red-500' : stageInfo.color.includes('yellow') ? 'from-yellow-500 to-orange-500' : 'from-red-500 to-pink-500'} mr-3`}>
                    <div className="text-white">
                      {stageInfo.icon}
                    </div>
                  </div>
                  <span>{stageInfo.title}</span>
                </CardTitle>
                <CardDescription>{stageInfo.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stage.data.map((item, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-gradient-primary pl-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-r-lg p-4 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{item.topic}</h4>
                        <Badge variant="info" size="sm">{item.percentage}</Badge>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                        {item.summary}
                      </p>
                      {item.example_quote && (
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <Quote className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
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

      {/* Journey Insights */}
      <Card variant="gradient" className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="text-purple-900 dark:text-purple-100 flex items-center">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 mr-3">
              <Map className="h-5 w-5 text-white" />
            </div>
            Key Journey Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20 dark:border-gray-700/20 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center mr-3">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">Critical Touchpoints</h4>
              </div>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                Focus on moments that most impact customer decisions and
                satisfaction.
              </p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20 dark:border-gray-700/20 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center mr-3">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">Pain Point Patterns</h4>
              </div>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                Address recurring friction points across multiple journey
                stages.
              </p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20 dark:border-gray-700/20 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mr-3">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">Opportunity Moments</h4>
              </div>
              <p className="text-sm text-purple-800 dark:text-purple-200">
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
