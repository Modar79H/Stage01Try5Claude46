// components/analysis/smart-competition-analysis.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Target,
  Users,
  Route,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Eye,
} from "lucide-react";

interface SmartCompetitionAnalysisProps {
  analysis?: {
    data?: {
      smart_competition_analysis?: {
        product_attributes: {
          attribute_comparison: Array<{
            attribute: string;
            you_have: boolean;
            competitors: Record<string, boolean>;
            differentiation_score: number;
            strategic_value: string;
            customer_importance: string;
          }>;
          unique_advantages: string[];
          feature_gaps: string[];
          strategic_recommendations: string[];
        };
        swot_matrix: {
          strength_comparison: {
            your_strengths: string[];
            competitor_strengths: Record<string, string[]>;
            competitive_advantages: string[];
            strength_gaps: string[];
          };
          weakness_comparison: {
            your_weaknesses: string[];
            competitor_weaknesses: Record<string, string[]>;
            shared_weaknesses: string[];
            relative_advantages: string[];
          };
          derived_opportunities: string[];
          derived_threats: string[];
        };
        segmentation_analysis: {
          your_primary_segments: string[];
          competitor_segments: Record<string, string[]>;
          overlap_analysis: Record<
            string,
            { overlap_score: number; shared_segments: string[] }
          >;
          untapped_segments: string[];
          positioning_opportunity: string;
          segment_recommendations: string[];
        };
        journey_analysis: {
          awareness: {
            your_friction_score: number;
            competitor_scores: Record<string, number>;
            winner: string;
            gap_analysis: string;
            improvement_opportunity?: string;
            competitive_advantage?: string;
          };
          purchase: {
            your_friction_score: number;
            competitor_scores: Record<string, number>;
            winner: string;
            gap_analysis: string;
            improvement_opportunity?: string;
            competitive_advantage?: string;
          };
          post_purchase: {
            your_friction_score: number;
            competitor_scores: Record<string, number>;
            winner: string;
            gap_analysis: string;
            improvement_opportunity?: string;
            competitive_advantage?: string;
          };
          strategic_focus: string;
          journey_recommendations: string[];
        };
        executive_summary: {
          competitive_position: string;
          key_advantages: string[];
          key_vulnerabilities: string[];
          strategic_priorities: string[];
          market_opportunity: string;
        };
      };
    };
    status?: string;
  };
}

export function SmartCompetitionAnalysis({
  analysis,
}: SmartCompetitionAnalysisProps) {
  if (!analysis?.data?.smart_competition_analysis) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">
              Smart Competition Analysis Not Available
            </p>
            <p className="text-sm">
              This analysis requires competitor data and completed foundational
              analyses
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = analysis.data.smart_competition_analysis;
  const getDifferentiationColor = (score: number) => {
    if (score > 0.5) return "text-green-600 bg-green-50";
    if (score > -0.5) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getFrictionColor = (score: number) => {
    if (score < 3) return "text-green-600";
    if (score < 7) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Competitive Position
            </h4>
            <p className="text-gray-700">
              {data.executive_summary.competitive_position}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                Key Advantages
              </h4>
              <ul className="space-y-1">
                {data.executive_summary.key_advantages.map((advantage, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{advantage}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-red-700 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Key Vulnerabilities
              </h4>
              <ul className="space-y-1">
                {data.executive_summary.key_vulnerabilities.map(
                  (vulnerability, idx) => (
                    <li key={idx} className="flex items-start">
                      <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        {vulnerability}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-blue-700 mb-2 flex items-center">
              <Target className="h-4 w-4 mr-1" />
              Strategic Priorities
            </h4>
            <div className="space-y-2">
              {data.executive_summary.strategic_priorities.map(
                (priority, idx) => (
                  <Badge key={idx} variant="outline" className="mr-2">
                    {idx + 1}. {priority}
                  </Badge>
                ),
              )}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-1">
              Market Opportunity
            </h4>
            <p className="text-blue-800 text-sm">
              {data.executive_summary.market_opportunity}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Product Attributes Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Product Attributes Battle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Attribute</th>
                  <th className="text-center py-2">You</th>
                  {data.product_attributes.attribute_comparison.length > 0 &&
                    Object.keys(
                      data.product_attributes.attribute_comparison[0]
                        .competitors,
                    ).map((competitorName) => (
                      <th key={competitorName} className="text-center py-2">
                        {competitorName}
                      </th>
                    ))}
                  <th className="text-center py-2">Advantage Score</th>
                  <th className="text-center py-2">Importance</th>
                </tr>
              </thead>
              <tbody>
                {data.product_attributes.attribute_comparison.map(
                  (attr, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2 font-medium">{attr.attribute}</td>
                      <td className="text-center py-2">
                        {attr.you_have ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                        )}
                      </td>
                      {Object.entries(attr.competitors).map(
                        ([competitorName, hasFeature]) => (
                          <td key={competitorName} className="text-center py-2">
                            {hasFeature ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                            )}
                          </td>
                        ),
                      )}
                      <td className="text-center py-2">
                        <Badge
                          className={getDifferentiationColor(
                            attr.differentiation_score,
                          )}
                        >
                          {attr.differentiation_score > 0 ? "+" : ""}
                          {attr.differentiation_score}
                        </Badge>
                      </td>
                      <td className="text-center py-2">
                        <Badge
                          variant={
                            attr.strategic_value === "high"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {attr.customer_importance}
                        </Badge>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div>
              <h4 className="font-semibold text-green-700 mb-2">
                🏆 Your Unique Advantages
              </h4>
              <ul className="text-sm space-y-1">
                {data.product_attributes.unique_advantages.map(
                  (advantage, idx) => (
                    <li key={idx} className="flex items-start">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-2 mt-1 flex-shrink-0" />
                      {advantage}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-red-700 mb-2">
                ⚠️ Feature Gaps
              </h4>
              <ul className="text-sm space-y-1">
                {data.product_attributes.feature_gaps.map((gap, idx) => (
                  <li key={idx} className="flex items-start">
                    <TrendingDown className="h-3 w-3 text-red-500 mr-2 mt-1 flex-shrink-0" />
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SWOT Matrix Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            SWOT Matrix Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Strengths Comparison */}
          <div>
            <h4 className="font-semibold text-green-700 mb-4 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Strengths Analysis
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">
                  Your Strengths
                </h5>
                <ul className="space-y-2">
                  {data.swot_matrix.strength_comparison.your_strengths.map(
                    (strength, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">
                          {strength}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-2">
                  Competitor Strengths
                </h5>
                <div className="space-y-3">
                  {Object.entries(
                    data.swot_matrix.strength_comparison.competitor_strengths,
                  ).map(([competitorName, strengths]) => (
                    <div
                      key={competitorName}
                      className="bg-gray-50 p-3 rounded"
                    >
                      <h6 className="font-medium text-gray-800 mb-1">
                        {competitorName}
                      </h6>
                      <ul className="space-y-1">
                        {strengths.map((strength, idx) => (
                          <li key={idx} className="text-sm text-gray-600">
                            • {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Weaknesses Comparison */}
          <div>
            <h4 className="font-semibold text-red-700 mb-4 flex items-center">
              <TrendingDown className="h-4 w-4 mr-2" />
              Weaknesses Analysis
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">
                  Your Weaknesses
                </h5>
                <ul className="space-y-2">
                  {data.swot_matrix.weakness_comparison.your_weaknesses.map(
                    (weakness, idx) => (
                      <li key={idx} className="flex items-start">
                        <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">
                          {weakness}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-2">
                  Competitor Weaknesses
                </h5>
                <div className="space-y-3">
                  {Object.entries(
                    data.swot_matrix.weakness_comparison.competitor_weaknesses,
                  ).map(([competitorName, weaknesses]) => (
                    <div
                      key={competitorName}
                      className="bg-gray-50 p-3 rounded"
                    >
                      <h6 className="font-medium text-gray-800 mb-1">
                        {competitorName}
                      </h6>
                      <ul className="space-y-1">
                        {weaknesses.map((weakness, idx) => (
                          <li key={idx} className="text-sm text-gray-600">
                            • {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Opportunities and Threats */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Derived Opportunities
              </h4>
              <ul className="space-y-2">
                {data.swot_matrix.derived_opportunities.map(
                  (opportunity, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span className="text-sm text-blue-800">
                        {opportunity}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Derived Threats
              </h4>
              <ul className="space-y-2">
                {data.swot_matrix.derived_threats.map((threat, idx) => (
                  <li key={idx} className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span className="text-sm text-red-800">{threat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Competitive Advantages */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                <Trophy className="h-4 w-4 mr-2" />
                Competitive Advantages
              </h4>
              <ul className="space-y-2">
                {data.swot_matrix.strength_comparison.competitive_advantages.map(
                  (advantage, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-green-800">
                        {advantage}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Relative Advantages
              </h4>
              <ul className="space-y-2">
                {data.swot_matrix.weakness_comparison.relative_advantages.map(
                  (advantage, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <span className="text-sm text-yellow-800">
                        {advantage}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          {/* Additional Insights */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">
                Strength Gaps
              </h4>
              <ul className="space-y-2">
                {data.swot_matrix.strength_comparison.strength_gaps.map(
                  (gap, idx) => (
                    <li key={idx} className="flex items-start">
                      <XCircle className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{gap}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">
                Shared Weaknesses
              </h4>
              <ul className="space-y-2">
                {data.swot_matrix.weakness_comparison.shared_weaknesses.map(
                  (weakness, idx) => (
                    <li key={idx} className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{weakness}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Journey Friction Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Route className="h-5 w-5 mr-2" />
            Customer Journey Battle Map
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {["awareness", "purchase", "post_purchase"].map((stage) => {
            const stageData =
              data.journey_analysis[
                stage as keyof typeof data.journey_analysis
              ];
            if (
              typeof stageData === "object" &&
              "your_friction_score" in stageData
            ) {
              const isWinner = stageData.winner === "you";
              return (
                <div key={stage} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold capitalize">
                      {stage.replace("_", " ")} Stage
                    </h4>
                    <Badge variant={isWinner ? "default" : "secondary"}>
                      {isWinner ? "🏆 You Win" : "❌ Competitor Wins"}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Your Friction Score
                      </p>
                      <div className="flex items-center space-x-2">
                        <Progress
                          value={stageData.your_friction_score * 10}
                          className="flex-1"
                        />
                        <span
                          className={`text-sm font-medium ${getFrictionColor(stageData.your_friction_score)}`}
                        >
                          {stageData.your_friction_score}/10
                        </span>
                      </div>
                    </div>
                    {Object.entries(stageData.competitor_scores).map(
                      ([competitorName, score]) => (
                        <div key={competitorName}>
                          <p className="text-sm text-gray-600 mb-1">
                            {competitorName} Friction Score
                          </p>
                          <div className="flex items-center space-x-2">
                            <Progress value={score * 10} className="flex-1" />
                            <span
                              className={`text-sm font-medium ${getFrictionColor(score)}`}
                            >
                              {score}/10
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Analysis:</strong> {stageData.gap_analysis}
                  </p>

                  {stageData.improvement_opportunity && (
                    <div className="bg-yellow-50 p-3 rounded">
                      <p className="text-sm text-yellow-800">
                        <strong>Opportunity:</strong>{" "}
                        {stageData.improvement_opportunity}
                      </p>
                    </div>
                  )}

                  {stageData.competitive_advantage && (
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-sm text-green-800">
                        <strong>Your Advantage:</strong>{" "}
                        {stageData.competitive_advantage}
                      </p>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })}
        </CardContent>
      </Card>

      {/* Segmentation Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Customer Segmentation Overlap
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Your Primary Segments</h4>
            <div className="space-y-1 mb-4">
              {data.segmentation_analysis.your_primary_segments.map(
                (segment, idx) => (
                  <Badge key={idx} variant="outline" className="mr-2">
                    {segment}
                  </Badge>
                ),
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">
              Competitor Segments & Overlap
            </h4>
            {Object.entries(data.segmentation_analysis.competitor_segments).map(
              ([competitorName, segments]) => (
                <div
                  key={competitorName}
                  className="mb-4 p-3 bg-gray-50 rounded"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{competitorName}</h5>
                    {data.segmentation_analysis.overlap_analysis[
                      competitorName
                    ] && (
                      <Badge variant="secondary">
                        {
                          data.segmentation_analysis.overlap_analysis[
                            competitorName
                          ].overlap_score
                        }
                        % Overlap
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    {segments.map((segment, idx) => (
                      <span key={idx} className="text-sm mr-2">
                        {segment}
                      </span>
                    ))}
                  </div>
                  {data.segmentation_analysis.overlap_analysis[competitorName]
                    ?.shared_segments.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Shared segments:</span>{" "}
                      {data.segmentation_analysis.overlap_analysis[
                        competitorName
                      ].shared_segments.join(", ")}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>

          {data.segmentation_analysis.untapped_segments.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">
                🎯 Untapped Market Segments
              </h4>
              <ul className="space-y-1">
                {data.segmentation_analysis.untapped_segments.map(
                  (segment, idx) => (
                    <li key={idx} className="text-sm text-green-700">
                      {segment}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-1">
              Positioning Opportunity
            </h4>
            <p className="text-blue-700 text-sm">
              {data.segmentation_analysis.positioning_opportunity}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Strategic Action Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-3">Product Strategy</h4>
            <ul className="space-y-2">
              {data.product_attributes.strategic_recommendations.map(
                (rec, idx) => (
                  <li key={idx} className="flex items-start">
                    <Badge variant="outline" className="mr-2 mt-0.5">
                      {idx + 1}
                    </Badge>
                    <span className="text-sm text-gray-700">{rec}</span>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Segmentation Strategy</h4>
            <ul className="space-y-2">
              {data.segmentation_analysis.segment_recommendations.map(
                (rec, idx) => (
                  <li key={idx} className="flex items-start">
                    <Badge variant="outline" className="mr-2 mt-0.5">
                      {idx + 1}
                    </Badge>
                    <span className="text-sm text-gray-700">{rec}</span>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">
              Customer Journey Optimization
            </h4>
            <div className="bg-yellow-50 p-3 rounded-lg mb-3">
              <p className="text-sm text-yellow-800">
                <strong>Primary Focus:</strong>{" "}
                {data.journey_analysis.strategic_focus}
              </p>
            </div>
            <ul className="space-y-2">
              {data.journey_analysis.journey_recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start">
                  <Badge variant="outline" className="mr-2 mt-0.5">
                    {idx + 1}
                  </Badge>
                  <span className="text-sm text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
