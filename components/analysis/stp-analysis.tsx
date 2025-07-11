// components/analysis/stp-analysis.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  User,
  GraduationCap,
  Briefcase,
  DollarSign,
  Heart,
  ShoppingCart,
  MessageSquare,
  Calendar,
  Eye,
  X,
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
          example_quote?: string;
          buyer_persona?: {
            persona_name: string;
            representation_percentage: string;
            persona_intro: string;
            demographics: {
              age: string;
              education_level: string;
              job_title: string;
              income_range: string;
              living_environment: string;
            };
            psychographics: {
              core_values: string;
              lifestyle: string;
              personality_traits: string;
              hobbies_interests: string;
            };
            goals_motivations: string[];
            pain_points_frustrations: string[];
            buying_behavior: {
              purchase_channels: string;
              research_habits: string;
              decision_triggers: string;
              objections_barriers: string;
            };
            product_use_behavior: string[];
            influencers_information_sources: {
              platforms: string;
              trusted_sources: string;
              content_consumed: string;
            };
            day_in_the_life: string;
          };
        }>;
        targeting_strategy: {
          selected_segments: string;
          approach_description: string;
          buyer_personas: string;
        };
        positioning_strategy: {
          positioning_statement: string;
          unique_value_proposition: string;
          marketing_mix: string | object;
          messaging_channels: string;
        };
        implementation_recommendations: {
          key_tactics: string | object;
          monitoring_suggestions: string | object;
        };
      };
    };
    status: string;
    error?: string;
  };
}

export function STPAnalysis({ analysis }: STPAnalysisProps) {
  const [showPersonaDialog, setShowPersonaDialog] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);

  const openPersonaDialog = (persona: any) => {
    setSelectedPersona(persona);
    setShowPersonaDialog(true);
  };
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

                  {/* Example Quote */}
                  {segment.example_quote && (
                    <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-gray-400">
                      <h5 className="font-medium text-gray-800 mb-1">
                        Customer Quote
                      </h5>
                      <p className="text-gray-700 text-sm italic">
                        "{segment.example_quote}"
                      </p>
                    </div>
                  )}

                  {/* Buyer Persona */}
                  {segment.buyer_persona && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center mr-3">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-purple-900">
                              {segment.buyer_persona.persona_name}
                            </h5>
                            <p className="text-sm text-purple-700">
                              Represents{" "}
                              {segment.buyer_persona.representation_percentage}{" "}
                              of customers
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() =>
                            openPersonaDialog(segment.buyer_persona)
                          }
                          className="bg-purple-600 hover:bg-purple-700"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Persona
                        </Button>
                      </div>
                      <p className="text-purple-800 italic text-sm">
                        {segment.buyer_persona.persona_intro}
                      </p>
                      <div className="mt-2 text-sm text-purple-700">
                        <span className="font-medium">Quick Profile:</span>{" "}
                        {segment.buyer_persona.demographics.age},{" "}
                        {segment.buyer_persona.demographics.job_title}
                      </div>
                    </div>
                  )}
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
            <div className="text-gray-700">
              {typeof data.positioning_strategy.marketing_mix === "object" ? (
                <div className="space-y-2">
                  {Object.entries(data.positioning_strategy.marketing_mix).map(
                    ([key, value]) => (
                      <div key={key}>
                        <strong>{key}:</strong> {String(value)}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p>{data.positioning_strategy.marketing_mix}</p>
              )}
            </div>
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
            <div className="text-gray-700">
              {typeof data.implementation_recommendations.key_tactics ===
              "object" ? (
                <div className="space-y-2">
                  {Object.entries(
                    data.implementation_recommendations.key_tactics,
                  ).map(([key, value]) => (
                    <div key={key}>
                      <strong>{key}:</strong> {String(value)}
                    </div>
                  ))}
                </div>
              ) : (
                <p>{data.implementation_recommendations.key_tactics}</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold flex items-center mb-2">
              <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
              Monitoring & Measurement
            </h4>
            <div className="text-gray-700">
              {typeof data.implementation_recommendations
                .monitoring_suggestions === "object" ? (
                <div className="space-y-2">
                  {Object.entries(
                    data.implementation_recommendations.monitoring_suggestions,
                  ).map(([key, value]) => (
                    <div key={key}>
                      <strong>{key}:</strong> {String(value)}
                    </div>
                  ))}
                </div>
              ) : (
                <p>
                  {data.implementation_recommendations.monitoring_suggestions}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buyer Persona Dialog */}
      <Dialog open={showPersonaDialog} onOpenChange={setShowPersonaDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mr-3">
                  <User className="h-6 w-6 text-white" />
                </div>
                {selectedPersona?.persona_name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPersonaDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedPersona && (
            <div className="space-y-6 mt-4">
              {/* Introduction */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-purple-800 font-medium italic text-lg">
                  {selectedPersona.persona_intro}
                </p>
                <Badge variant="secondary" className="mt-2">
                  Represents {selectedPersona.representation_percentage} of your
                  customers
                </Badge>
              </div>

              {/* Demographics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">
                        <strong>Age:</strong> {selectedPersona.demographics.age}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">
                        <strong>Education:</strong>{" "}
                        {selectedPersona.demographics.education_level}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">
                        <strong>Job:</strong>{" "}
                        {selectedPersona.demographics.job_title}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">
                        <strong>Income:</strong>{" "}
                        {selectedPersona.demographics.income_range}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">
                        <strong>Location:</strong>{" "}
                        {selectedPersona.demographics.living_environment}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Psychographics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2" />
                    Psychographics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <strong>Core Values:</strong>{" "}
                    {selectedPersona.psychographics.core_values}
                  </div>
                  <div>
                    <strong>Lifestyle:</strong>{" "}
                    {selectedPersona.psychographics.lifestyle}
                  </div>
                  <div>
                    <strong>Personality:</strong>{" "}
                    {selectedPersona.psychographics.personality_traits}
                  </div>
                  <div>
                    <strong>Hobbies:</strong>{" "}
                    {selectedPersona.psychographics.hobbies_interests}
                  </div>
                </CardContent>
              </Card>

              {/* Goals & Motivations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Goals & Motivations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selectedPersona.goals_motivations?.map(
                      (goal: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700">{goal}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </CardContent>
              </Card>

              {/* Pain Points */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Pain Points & Frustrations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selectedPersona.pain_points_frustrations?.map(
                      (pain: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700">{pain}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </CardContent>
              </Card>

              {/* Buying Behavior */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Buying Behavior
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <strong>Purchase Channels:</strong>{" "}
                    {selectedPersona.buying_behavior.purchase_channels}
                  </div>
                  <div>
                    <strong>Research Habits:</strong>{" "}
                    {selectedPersona.buying_behavior.research_habits}
                  </div>
                  <div>
                    <strong>Decision Triggers:</strong>{" "}
                    {selectedPersona.buying_behavior.decision_triggers}
                  </div>
                  <div>
                    <strong>Barriers:</strong>{" "}
                    {selectedPersona.buying_behavior.objections_barriers}
                  </div>
                </CardContent>
              </Card>

              {/* Product Use Behavior */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Product Use Behavior
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selectedPersona.product_use_behavior?.map(
                      (behavior: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700">{behavior}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </CardContent>
              </Card>

              {/* Influencers & Information Sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Influencers & Information Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <strong>Platforms:</strong>{" "}
                    {selectedPersona.influencers_information_sources.platforms}
                  </div>
                  <div>
                    <strong>Trusted Sources:</strong>{" "}
                    {
                      selectedPersona.influencers_information_sources
                        .trusted_sources
                    }
                  </div>
                  <div>
                    <strong>Content Consumed:</strong>{" "}
                    {
                      selectedPersona.influencers_information_sources
                        .content_consumed
                    }
                  </div>
                </CardContent>
              </Card>

              {/* Day in the Life */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />A Day in the Life
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedPersona.day_in_the_life}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
