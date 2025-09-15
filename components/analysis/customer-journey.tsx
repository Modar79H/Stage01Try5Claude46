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
import {
  ANALYSIS_COLORS,
  CLEAN_CARD_STYLES,
  HEADER_STYLES,
  QUOTE_STYLES,
} from "@/styles/analysis-styles";
import { BadgeTooltip } from "./BadgeTooltip";

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
        colorScheme: "opportunity" as const, // Use muted blue
      };
    case "consideration":
      return {
        icon: <Search className="h-5 w-5" />,
        title: "Consideration",
        description: "Research phase and decision factors",
        colorScheme: "opportunity" as const, // Use muted blue
      };
    case "purchase":
      return {
        icon: <ShoppingCart className="h-5 w-5" />,
        title: "Purchase",
        description: "Buying process and transaction experience",
        colorScheme: "strength" as const, // Use muted green
      };
    case "delivery_unboxing":
      return {
        icon: <Truck className="h-5 w-5" />,
        title: "Delivery & Unboxing",
        description: "Receiving and first impressions",
        colorScheme: "threat" as const, // Use muted orange
      };
    case "usage":
      return {
        icon: <Star className="h-5 w-5" />,
        title: "Usage",
        description: "Product experience and satisfaction",
        colorScheme: "strength" as const, // Use muted green
      };
    case "post_purchase":
      return {
        icon: <MessageCircle className="h-5 w-5" />,
        title: "Post-Purchase",
        description: "Advocacy, returns, and repeat purchases",
        colorScheme: "opportunity" as const, // Use muted blue
      };
    default:
      return {
        icon: <Map className="h-5 w-5" />,
        title: stage,
        description: "",
        colorScheme: "opportunity" as const,
      };
  }
};

export function CustomerJourney({ analysis }: CustomerJourneyProps) {
  if (!analysis || analysis.status !== "completed") {
    return (
      <div className={`${CLEAN_CARD_STYLES.base} ${CLEAN_CARD_STYLES.padding}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Map className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg font-medium">
            {analysis?.status === "processing"
              ? "Analyzing customer journey..."
              : "Customer Journey analysis not yet completed"}
          </p>
        </div>
      </div>
    );
  }

  const data = analysis.data?.customer_journey;

  if (!data) {
    return (
      <div className={`${CLEAN_CARD_STYLES.base} ${CLEAN_CARD_STYLES.padding}`}>
        <p className="text-gray-600 text-center">
          No customer journey data available.
        </p>
      </div>
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
      {/* Clean Journey Stages Overview */}
      <div className={`${CLEAN_CARD_STYLES.base} ${CLEAN_CARD_STYLES.padding}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Customer Journey Stages
        </h3>

        {/* Desktop Flow */}
        <div className="hidden md:flex items-center justify-between space-x-2">
          {journeyStages.map((stage, index) => {
            const stageInfo = getStageInfo(stage.key);
            const colors = ANALYSIS_COLORS[stageInfo.colorScheme];

            return (
              <div key={stage.key} className="flex-1 relative">
                <div
                  className="rounded-lg p-4 text-center border-l-4 transition-all duration-200 hover:shadow-md"
                  style={{
                    backgroundColor: colors.bg,
                    borderLeftColor: colors.border,
                    color: colors.text,
                  }}
                >
                  <div className="flex flex-col items-center">
                    <div className="mb-2" style={{ color: colors.icon }}>
                      {stageInfo.icon}
                    </div>
                    <p className="text-sm font-semibold">{stageInfo.title}</p>
                  </div>
                </div>

                {/* Arrow connector */}
                {index < journeyStages.length - 1 && (
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-b-4 border-l-transparent border-r-gray-400 border-t-transparent border-b-transparent"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Flow */}
        <div className="md:hidden space-y-3">
          {journeyStages.map((stage, index) => {
            const stageInfo = getStageInfo(stage.key);
            const colors = ANALYSIS_COLORS[stageInfo.colorScheme];

            return (
              <div key={stage.key}>
                <div
                  className="rounded-lg p-4 border-l-4"
                  style={{
                    backgroundColor: colors.bg,
                    borderLeftColor: colors.border,
                    color: colors.text,
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div style={{ color: colors.icon }}>{stageInfo.icon}</div>
                    <div>
                      <p className="font-semibold">{stageInfo.title}</p>
                      <p className="text-xs opacity-80">
                        {stageInfo.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile connector */}
                {index < journeyStages.length - 1 && (
                  <div className="flex justify-center my-2">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {journeyStages.map((stage) => {
          if (!stage.data || stage.data.length === 0) return null;

          const stageInfo = getStageInfo(stage.key);
          const colors = ANALYSIS_COLORS[stageInfo.colorScheme];

          return (
            <div
              key={stage.key}
              className={`${CLEAN_CARD_STYLES.base} ${CLEAN_CARD_STYLES.hover}`}
            >
              {/* Clean Header */}
              <div
                className="px-6 py-4 border-l-4"
                style={{
                  backgroundColor: colors.bg,
                  borderLeftColor: colors.border,
                  color: colors.text,
                }}
              >
                <div className="flex items-center space-x-3">
                  <div style={{ color: colors.icon }}>{stageInfo.icon}</div>
                  <div>
                    <h3 className="font-semibold">{stageInfo.title}</h3>
                    <p className="text-sm opacity-80">
                      {stageInfo.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {stage.data
                  .filter((item: any) => {
                    if (!item.percentage) return true; // Keep topics without percentage
                    const value = parseFloat(item.percentage.replace("%", ""));
                    return value >= 1; // Only keep topics with 1% or higher
                  })
                  .map((item, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-gray-900">
                          {item.topic}
                        </h4>
                        <BadgeTooltip type="percentage" value={item.percentage}>
                          <span
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{
                              backgroundColor: colors.bg,
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            {item.percentage || "Calculating..."}
                          </span>
                        </BadgeTooltip>
                      </div>

                      <p className="text-sm text-gray-700">{item.summary}</p>

                      {item.example_quote && (
                        <div className={`${QUOTE_STYLES.container}`}>
                          <div className="flex items-start space-x-2">
                            <Quote className={`${QUOTE_STYLES.icon} mt-0.5`} />
                            <p className={`${QUOTE_STYLES.text}`}>
                              "{item.example_quote}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overview Table */}
      {data.journey_table && (
        <div
          className={`${CLEAN_CARD_STYLES.base} ${CLEAN_CARD_STYLES.padding}`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Customer Journey Overview
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Stage
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Actions
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Touchpoints
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Emotions
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Pain Points
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
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
                    <tr
                      key={stage.key}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div
                            style={{
                              color:
                                ANALYSIS_COLORS[stageInfo.colorScheme].icon,
                            }}
                          >
                            {stageInfo.icon}
                          </div>
                          <span className="font-medium text-gray-900">
                            {stageInfo.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {stageData.customer_actions}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {stageData.touchpoints}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {stageData.emotions}
                      </td>
                      <td className="py-3 px-4 text-sm text-red-700">
                        {stageData.pain_points}
                      </td>
                      <td className="py-3 px-4 text-sm text-green-700">
                        {stageData.opportunities}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
