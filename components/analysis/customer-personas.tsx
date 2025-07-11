// components/analysis/customer-personas.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  AlertCircle,
  User,
  MapPin,
  GraduationCap,
  Briefcase,
  DollarSign,
  Heart,
  Target,
  ShoppingCart,
  MessageSquare,
  Calendar,
  Eye,
  X,
  Package,
} from "lucide-react";

interface PersonaData {
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
  image_url?: string;
}

interface CustomerPersonasProps {
  analysis?: {
    data: {
      customer_personas?: PersonaData[];
    };
    status: string;
    error?: string;
  };
}

export function CustomerPersonas({ analysis }: CustomerPersonasProps) {
  const [selectedPersona, setSelectedPersona] = useState<PersonaData | null>(
    null,
  );
  const [showPersonaDialog, setShowPersonaDialog] = useState(false);

  if (!analysis || analysis.status !== "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Customer Personas
          </CardTitle>
          <CardDescription>
            AI-generated customer personas with demographics and behaviors
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

  const data = analysis.data.customer_personas;

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Customer Personas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No persona data available.</p>
        </CardContent>
      </Card>
    );
  }

  const openPersonaDialog = (persona: PersonaData) => {
    setSelectedPersona(persona);
    setShowPersonaDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Customer Personas
          </CardTitle>
          <CardDescription>
            AI-generated customer personas based on review analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Our AI identified {data.length} distinct customer persona
            {data.length > 1 ? "s" : ""}
            from your review data. Click on any persona card to see detailed
            insights.
          </p>
        </CardContent>
      </Card>

      {/* Persona Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((persona, index) => (
          <Card
            key={index}
            className="hover:shadow-lg transition-shadow cursor-pointer"
          >
            <CardHeader>
              <div className="flex items-center space-x-3">
                {persona.image_url ? (
                  <img
                    src={persona.image_url}
                    alt={persona.persona_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {persona.persona_name}
                  </CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {persona.representation_percentage} of customers
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-blue-700 font-medium italic">
                {persona.persona_intro}
              </p>

              {/* Quick Demographics */}
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  {persona.demographics.age}, {persona.demographics.job_title}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {persona.demographics.living_environment}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  {persona.demographics.education_level}
                </div>
              </div>

              {/* Quick Insights */}
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Values: </span>
                  {persona.psychographics.core_values}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Lifestyle: </span>
                  {persona.psychographics.lifestyle}
                </div>
              </div>

              <Button
                onClick={() => openPersonaDialog(persona)}
                className="w-full"
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Analysis
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Persona Dialog */}
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
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mr-3">
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
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 font-medium italic text-lg">
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
                      <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">
                        <strong>Job:</strong>{" "}
                        {selectedPersona.demographics.job_title}
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
                      <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">
                        <strong>Income:</strong>{" "}
                        {selectedPersona.demographics.income_range}
                      </span>
                    </div>
                    <div className="flex items-center col-span-2">
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
                    <strong>Interests:</strong>{" "}
                    {selectedPersona.psychographics.hobbies_interests}
                  </div>
                </CardContent>
              </Card>

              {/* Goals & Pain Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-700">
                      <Target className="h-5 w-5 mr-2" />
                      Goals & Motivations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedPersona.goals_motivations.map((goal, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span className="text-sm">{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-red-700">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Pain Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedPersona.pain_points_frustrations.map(
                        (pain, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-red-600 mr-2">•</span>
                            <span className="text-sm">{pain}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>

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
                    <Package className="h-5 w-5 mr-2" />
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
