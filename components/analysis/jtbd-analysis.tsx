// components/analysis/jtbd-analysis.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JTBDChart } from "@/components/charts/jtbd-chart";
import {
  Target,
  AlertCircle,
  Quote,
  Wrench,
  Heart,
  Users2,
} from "lucide-react";

interface JTBDAnalysisProps {
  analysis?: {
    data: {
      jtbd_analysis?: {
        functional_jobs: Array<{
          job_statement: string;
          percentage: string;
          importance: string;
          summary: string;
          example_quote: string;
        }>;
        emotional_jobs: Array<{
          job_statement: string;
          percentage: string;
          importance: string;
          summary: string;
          example_quote: string;
        }>;
        social_jobs: Array<{
          job_statement: string;
          percentage: string;
          importance: string;
          summary: string;
          example_quote: string;
        }>;
      };
    };
    status: string;
    error?: string;
  };
}

const getImportanceColor = (importance: string) => {
  switch (importance.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getJobTypeInfo = (type: string) => {
  switch (type) {
    case "functional":
      return {
        icon: <Wrench className="h-5 w-5" />,
        title: "Functional Jobs",
        description: "Practical tasks and functional needs",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-500",
      };
    case "emotional":
      return {
        icon: <Heart className="h-5 w-5" />,
        title: "Emotional Jobs",
        description: "Feelings and emotional outcomes desired",
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-500",
      };
    case "social":
      return {
        icon: <Users2 className="h-5 w-5" />,
        title: "Social Jobs",
        description: "Social status and reputation needs",
        color: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-500",
      };
    default:
      return {
        icon: <Target className="h-5 w-5" />,
        title: "Jobs",
        description: "",
        color: "text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-500",
      };
  }
};

export function JTBDAnalysis({ analysis }: JTBDAnalysisProps) {
  if (!analysis || analysis.status !== "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Jobs to be Done Analysis
          </CardTitle>
          <CardDescription>
            Understanding why customers "hire" your product using Christensen
            methodology
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

  const data = analysis.data.jtbd_analysis;

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Jobs to be Done Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No JTBD data available.</p>
        </CardContent>
      </Card>
    );
  }

  const jobTypes = [
    { key: "functional", data: data.functional_jobs || [] },
    { key: "emotional", data: data.emotional_jobs || [] },
    { key: "social", data: data.social_jobs || [] },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Jobs to be Done Overview
          </CardTitle>
          <CardDescription>
            Distribution of functional, emotional, and social jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JTBDChart data={data} />
        </CardContent>
      </Card>

      {/* Methodology Explanation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">About Jobs to be Done</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <p className="mb-3">
            The Jobs to be Done framework helps understand why customers "hire"
            your product. Each job follows the format: "When [situation], I want
            [action], so that [outcome]."
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <Wrench className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold">Functional Jobs</h4>
              <p className="text-sm">Practical tasks and problems to solve</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <Heart className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <h4 className="font-semibold">Emotional Jobs</h4>
              <p className="text-sm">Feelings and emotional outcomes desired</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <Users2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold">Social Jobs</h4>
              <p className="text-sm">How customers want to be perceived</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Job Types */}
      {jobTypes.map((jobType) => {
        if (!jobType.data || jobType.data.length === 0) return null;

        const typeInfo = getJobTypeInfo(jobType.key);

        return (
          <Card key={jobType.key}>
            <CardHeader>
              <CardTitle className={`flex items-center ${typeInfo.color}`}>
                {typeInfo.icon}
                <span className="ml-2">{typeInfo.title}</span>
              </CardTitle>
              <CardDescription>{typeInfo.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {jobType.data.map((job, index) => (
                  <div
                    key={index}
                    className={`border-l-4 ${typeInfo.borderColor} pl-4`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2">
                          {job.job_statement}
                        </h4>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getImportanceColor(job.importance)}>
                            {job.importance}
                          </Badge>
                          <Badge variant="outline">{job.percentage}</Badge>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{job.summary}</p>
                    {job.example_quote && (
                      <div
                        className={`${typeInfo.bgColor} border ${typeInfo.borderColor} rounded-lg p-3`}
                      >
                        <div className="flex items-start space-x-2">
                          <Quote
                            className={`h-4 w-4 mt-0.5 flex-shrink-0 ${typeInfo.color}`}
                          />
                          <p className={`italic text-sm ${typeInfo.color}`}>
                            "{job.example_quote}"
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
  );
}
