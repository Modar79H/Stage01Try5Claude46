// components/analysis/stp-analysis.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STPChart } from "@/components/charts/stp-chart";
import {
  Target,
  AlertCircle,
  Users,
  Crosshair,
  MapPin,
  TrendingUp,
  Lightbulb,
  CheckCircle,
} from "lucide-react";

interface STPAnalysisProps {
  analysis?: {
    data: {
      stp_analysis?: {
        market_definition: string;
        segmentation: Array<{
          segment: string;
          percentage: string;
          description: string;
          attractiveness_factors: string;
          opportunities: string;
          challenges: string;
        }>;
        targeting_strategy: {
          selected_segments: string;
          approach_description: string;
          buyer_personas: string;
        };
        positioning_strategy: {
          positioning_statement: string;
          unique_value_proposition: string;
          marketing_mix: string;
          messaging_channels: string;
        };
        implementation_recommendations: {
          key_tactics: string;
          monitoring_suggestions: string;
        };
      };
    };
    status: string;
    error?: string;
  };
}

export function STPAnalysis({ analysis }: STPAnalysisProps) {
  if (!analysis || analysis.status !== "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            STP Analysis
          </CardTitle>
          <CardDescription>
            Segmentation, Targeting, and Positioning strategic analysis
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

  const data = analysis.data.stp_analysis;

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            STP Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No STP analysis data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* STP Framework Overview */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">
            STP Marketing Framework
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold">Segmentation</h3>
              <p className="text-sm">Divide market into groups</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <Crosshair className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold">Targeting</h3>
              <p className="text-sm">Select segments to serve</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <MapPin className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold">Positioning</h3>
              <p className="text-sm">Create distinct market position</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Definition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Market Definition
          </CardTitle>
          <CardDescription>
            Overall market context and industry landscape
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">
            {data.market_definition}
          </p>
        </CardContent>
      </Card>

      {/* Segmentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-blue-700">
            <Users className="h-5 w-5 mr-2" />
            Market Segmentation
          </CardTitle>
          <CardDescription>
            Identified market segments and their characteristics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.segmentation && data.segmentation.length > 0 && (
            <div className="mb-6">
              <STPChart segments={data.segmentation} />
            </div>
          )}

          <div className="space-y-6">
            {data.segmentation?.map((segment, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-lg">{segment.segment}</h4>
                  <Badge variant="outline">{segment.percentage}</Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">
                      Description
                    </h5>
                    <p className="text-gray-700 text-sm">
                      {segment.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h5 className="font-medium text-green-800 mb-1">
                        Attractiveness
                      </h5>
                      <p className="text-green-700 text-sm">
                        {segment.attractiveness_factors}
                      </p>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h5 className="font-medium text-blue-800 mb-1">
                        Opportunities
                      </h5>
                      <p className="text-blue-700 text-sm">
                        {segment.opportunities}
                      </p>
                    </div>

                    <div className="bg-orange-50 p-3 rounded-lg">
                      <h5 className="font-medium text-orange-800 mb-1">
                        Challenges
                      </h5>
                      <p className="text-orange-700 text-sm">
                        {segment.challenges}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Targeting Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-green-700">
            <Crosshair className="h-5 w-5 mr-2" />
            Targeting Strategy
          </CardTitle>
          <CardDescription>
            Selected target segments and approach
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Selected Segments</h4>
            <p className="text-gray-700">
              {data.targeting_strategy.selected_segments}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Targeting Approach</h4>
            <p className="text-gray-700">
              {data.targeting_strategy.approach_description}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Buyer Personas</h4>
            <p className="text-gray-700">
              {data.targeting_strategy.buyer_personas}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Positioning Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-purple-700">
            <MapPin className="h-5 w-5 mr-2" />
            Positioning Strategy
          </CardTitle>
          <CardDescription>
            Brand positioning and value proposition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">
              Positioning Statement
            </h4>
            <p className="text-purple-800 italic">
              {data.positioning_strategy.positioning_statement}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Unique Value Proposition</h4>
            <p className="text-gray-700">
              {data.positioning_strategy.unique_value_proposition}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Marketing Mix (4Ps)</h4>
            <p className="text-gray-700">
              {data.positioning_strategy.marketing_mix}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Messaging & Channels</h4>
            <p className="text-gray-700">
              {data.positioning_strategy.messaging_channels}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            Implementation Recommendations
          </CardTitle>
          <CardDescription>
            Actionable tactics and monitoring suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold flex items-center mb-2">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Key Tactics
            </h4>
            <p className="text-gray-700">
              {data.implementation_recommendations.key_tactics}
            </p>
          </div>

          <div>
            <h4 className="font-semibold flex items-center mb-2">
              <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
              Monitoring & Measurement
            </h4>
            <p className="text-gray-700">
              {data.implementation_recommendations.monitoring_suggestions}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
