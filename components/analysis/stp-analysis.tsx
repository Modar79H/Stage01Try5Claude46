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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  MessageCircle,
  HelpCircle,
} from "lucide-react";
import { PersonaChatbot } from "@/components/persona/PersonaChatbot";

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
  brandId?: string;
  productId?: string;
  productName?: string;
}

export function STPAnalysis({
  analysis,
  brandId,
  productId,
  productName,
}: STPAnalysisProps) {
  const [showPersonaDialog, setShowPersonaDialog] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatPersona, setChatPersona] = useState<any>(null);

  const openPersonaDialog = (persona: any) => {
    setSelectedPersona(persona);
    setShowPersonaDialog(true);
  };

  const openPersonaChat = (persona: any) => {
    setChatPersona(persona);
    setShowChatbot(true);
  };
  if (!analysis || analysis.status !== "completed") {
    return (
      <Card variant="glass" hover>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 mr-3">
              <Target className="h-5 w-5 text-white" />
            </div>
            STP Analysis
          </CardTitle>
          <CardDescription>
            Segmentation, Targeting, and Positioning strategic analysis
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

  const data = analysis.data.stp_analysis;

  if (!data) {
    return (
      <Card variant="glass" hover>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 mr-3">
              <Target className="h-5 w-5 text-white" />
            </div>
            STP Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">No STP analysis data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* STP Framework Overview */}
      <Card variant="gradient" className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-900 dark:text-green-100 flex items-center">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 mr-3">
              <Target className="h-5 w-5 text-white" />
            </div>
            STP Marketing Framework
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 dark:border-gray-700/20 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Segmentation</h3>
              <p className="text-sm text-green-800 dark:text-green-200">Divide market into groups</p>
            </div>
            <div className="text-center p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 dark:border-gray-700/20 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                <Crosshair className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Targeting</h3>
              <p className="text-sm text-green-800 dark:text-green-200">Select segments to serve</p>
            </div>
            <div className="text-center p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 dark:border-gray-700/20 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Positioning</h3>
              <p className="text-sm text-green-800 dark:text-green-200">Create distinct market position</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Definition */}
      <Card variant="glass" hover>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 mr-3">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            Market Definition
          </CardTitle>
          <CardDescription>
            Overall market context and industry landscape
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {data.market_definition}
          </p>
        </CardContent>
      </Card>

      {/* Segmentation */}
      <Card variant="glass" hover>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 mr-3">
              <Users className="h-5 w-5 text-white" />
            </div>
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
              <div key={index} className="border-l-4 border-gradient-primary pl-6 bg-gray-50/50 dark:bg-gray-800/50 rounded-r-lg p-6 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{segment.segment}</h4>
                  <Badge variant="info" size="sm">{segment.percentage}</Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                      Description
                    </h5>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {segment.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-green-200 dark:border-green-800 shadow-sm">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mr-2">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <h5 className="font-medium text-green-800 dark:text-green-300">
                          Attractiveness
                        </h5>
                      </div>
                      <p className="text-green-700 dark:text-green-300 text-sm">
                        {segment.attractiveness_factors}
                      </p>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center mr-2">
                          <Lightbulb className="h-4 w-4 text-white" />
                        </div>
                        <h5 className="font-medium text-blue-800 dark:text-blue-300">
                          Opportunities
                        </h5>
                      </div>
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        {segment.opportunities}
                      </p>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center mr-2">
                          <AlertCircle className="h-4 w-4 text-white" />
                        </div>
                        <h5 className="font-medium text-orange-800 dark:text-orange-300">
                          Challenges
                        </h5>
                      </div>
                      <p className="text-orange-700 dark:text-orange-300 text-sm">
                        {segment.challenges}
                      </p>
                    </div>
                  </div>

                  {/* Example Quote */}
                  {segment.example_quote && (
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                        Customer Quote
                      </h5>
                      <p className="text-gray-700 dark:text-gray-300 text-sm italic">
                        "{segment.example_quote}"
                      </p>
                    </div>
                  )}

                  {/* Buyer Persona */}
                  {segment.buyer_persona && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          {segment.buyer_persona.image_url ? (
                            <img
                              src={segment.buyer_persona.image_url}
                              alt={segment.buyer_persona.persona_name}
                              className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-white shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mr-4 shadow-sm">
                              <User className="h-6 w-6 text-white" />
                            </div>
                          )}
                          <div>
                            <h5 className="font-semibold text-purple-900 dark:text-purple-100">
                              {segment.buyer_persona.persona_name}
                            </h5>
                            <p className="text-sm text-purple-700 dark:text-purple-300">
                              Represents{" "}
                              {segment.buyer_persona.representation_percentage}{" "}
                              of customers
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() =>
                              openPersonaDialog(segment.buyer_persona)
                            }
                            variant="gradient"
                            size="sm"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          {brandId && productId && (
                            <Button
                              onClick={() =>
                                openPersonaChat(segment.buyer_persona)
                              }
                              variant="outline"
                              size="sm"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Chat
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-purple-800 dark:text-purple-200 italic text-sm mb-3">
                        {segment.buyer_persona.persona_intro}
                      </p>
                      <div className="text-sm text-purple-700 dark:text-purple-300 bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
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
      <Card variant="glass" hover>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 mr-3">
              <Crosshair className="h-5 w-5 text-white" />
            </div>
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
            <TooltipProvider>
              <h4 className="font-semibold mb-2 flex items-center">
                Targeting Approach
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-2 text-gray-400 hover:text-gray-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm p-4 space-y-3 bg-gray-900 text-gray-50">
                    <div>
                      <strong className="text-white">Undifferentiated:</strong>{" "}
                      Also called mass marketing, it involves offering a single
                      marketing mix to the whole market without tailoring to
                      specific segments.
                    </div>
                    <div>
                      <strong className="text-white">Differentiated:</strong>{" "}
                      Targets multiple distinct segments with different
                      marketing mixes customized for each segment's needs and
                      preferences.
                    </div>
                    <div>
                      <strong className="text-white">Concentrated:</strong>{" "}
                      Focuses all marketing efforts on one well-defined segment
                      (a niche), tailoring product and marketing mix exclusively
                      to that group.
                    </div>
                  </TooltipContent>
                </Tooltip>
              </h4>
            </TooltipProvider>
            <p className="text-gray-700">
              <strong>
                {data.targeting_strategy.approach_description.split(":")[0]}:
              </strong>
              {data.targeting_strategy.approach_description.includes(":")
                ? data.targeting_strategy.approach_description
                    .split(":")
                    .slice(1)
                    .join(":")
                    .trim()
                : data.targeting_strategy.approach_description}
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
      <Card variant="glass" hover>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 mr-3">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            Positioning Strategy
          </CardTitle>
          <CardDescription>
            Brand positioning and value proposition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6 shadow-sm">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mr-3">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              Positioning Statement
            </h4>
            <p className="text-purple-800 dark:text-purple-200 italic">
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
      <Card variant="glass" hover>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 mr-3">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
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
                {selectedPersona?.image_url ? (
                  <img
                    src={selectedPersona.image_url}
                    alt={selectedPersona.persona_name}
                    className="w-12 h-12 rounded-full object-cover mr-3"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mr-3">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}
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

      {/* Persona Chatbot */}
      {brandId && productId && chatPersona && (
        <PersonaChatbot
          isOpen={showChatbot}
          onClose={() => setShowChatbot(false)}
          personaData={chatPersona}
          brandId={brandId}
          productId={productId}
          productName={productName || "this product"}
        />
      )}
    </div>
  );
}
