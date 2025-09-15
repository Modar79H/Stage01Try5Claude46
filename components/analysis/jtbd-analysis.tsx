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
import {
  ANALYSIS_COLORS,
  CLEAN_CARD_STYLES,
  QUOTE_STYLES,
} from "@/styles/analysis-styles";
import { BadgeTooltip } from "./BadgeTooltip";

interface JTBDAnalysisProps {
  analysis?: {
    data: {
      jtbd_analysis?: {
        functional_jobs: Array<{
          job?: string;
          job_statement: string;
          percentage: string;
          importance: string;
          summary: string;
          example_quote: string;
        }>;
        emotional_jobs: Array<{
          job?: string;
          job_statement: string;
          percentage: string;
          importance: string;
          summary: string;
          example_quote: string;
        }>;
        social_jobs: Array<{
          job?: string;
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

const getJobTypeInfo = (type: string) => {
  switch (type) {
    case "functional":
      return {
        icon: <Wrench className="h-5 w-5" />,
        title: "Functional Jobs",
        description: "Practical tasks and functional needs",
        colorScheme: "opportunity" as const, // Use muted blue
      };
    case "emotional":
      return {
        icon: <Heart className="h-5 w-5" />,
        title: "Emotional Jobs",
        description: "Feelings and emotional outcomes desired",
        colorScheme: "weakness" as const, // Use muted red
      };
    case "social":
      return {
        icon: <Users2 className="h-5 w-5" />,
        title: "Social Jobs",
        description: "Social status and reputation needs",
        colorScheme: "strength" as const, // Use muted green
      };
    default:
      return {
        icon: <Target className="h-5 w-5" />,
        title: "Jobs",
        description: "",
        colorScheme: "opportunity" as const,
      };
  }
};

export function JTBDAnalysis({ analysis }: JTBDAnalysisProps) {
  if (!analysis || analysis.status !== "completed") {
    return (
      <div className={`${CLEAN_CARD_STYLES.base} ${CLEAN_CARD_STYLES.padding}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg font-medium">
            {analysis?.status === "processing"
              ? "Analyzing jobs to be done..."
              : "Jobs to be Done analysis not yet completed"}
          </p>
        </div>
      </div>
    );
  }

  const data = analysis.data?.jtbd_analysis;

  if (!data) {
    return (
      <div className={`${CLEAN_CARD_STYLES.base} ${CLEAN_CARD_STYLES.padding}`}>
        <p className="text-gray-600 text-center">No JTBD data available.</p>
      </div>
    );
  }

  const jobTypes = [
    { key: "functional", data: data.functional_jobs || [] },
    { key: "emotional", data: data.emotional_jobs || [] },
    { key: "social", data: data.social_jobs || [] },
  ];

  return (
    <div className="space-y-6">
      {/* Charts Overview with Clean Design */}
      <div className={`${CLEAN_CARD_STYLES.base} ${CLEAN_CARD_STYLES.padding}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Jobs to be Done Overview
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Distribution of functional, emotional, and social jobs
        </p>
        <JTBDChart data={data} />
      </div>

      {/* Clean Methodology Explanation */}
      <div
        className={`${CLEAN_CARD_STYLES.base} ${CLEAN_CARD_STYLES.padding}`}
        style={{ backgroundColor: ANALYSIS_COLORS.opportunity.bg }}
      >
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: ANALYSIS_COLORS.opportunity.text }}
        >
          About Jobs to be Done
        </h3>
        <p
          className="mb-4 text-sm"
          style={{ color: ANALYSIS_COLORS.opportunity.text }}
        >
          The Jobs to be Done framework helps understand why customers "hire"
          your product. Each job follows the format: "When [situation], I want
          [action], so that [outcome]."
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {jobTypes.map((jobType) => {
            const typeInfo = getJobTypeInfo(jobType.key);
            const colors = ANALYSIS_COLORS[typeInfo.colorScheme];

            return (
              <div
                key={jobType.key}
                className="text-center p-4 rounded-lg border-l-4"
                style={{
                  backgroundColor: ANALYSIS_COLORS.card.bg,
                  borderLeftColor: colors.border,
                }}
              >
                <div
                  className="mb-2 flex justify-center"
                  style={{ color: colors.icon }}
                >
                  {typeInfo.icon}
                </div>
                <h4 className="font-semibold text-gray-900">
                  {typeInfo.title}
                </h4>
                <p className="text-sm text-gray-600">{typeInfo.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Job Type Sections with Clean Design */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {jobTypes.map((jobType) => {
          if (!jobType.data || jobType.data.length === 0) return null;

          const typeInfo = getJobTypeInfo(jobType.key);
          const colors = ANALYSIS_COLORS[typeInfo.colorScheme];

          return (
            <div
              key={jobType.key}
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
                  <div style={{ color: colors.icon }}>{typeInfo.icon}</div>
                  <div>
                    <h3 className="font-semibold">{typeInfo.title}</h3>
                    <p className="text-sm opacity-80">{typeInfo.description}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {jobType.data
                  .filter((job: any) => {
                    if (!job.percentage) return true; // Keep topics without percentage
                    const value = parseFloat(job.percentage.replace("%", ""));
                    return value >= 1; // Only keep topics with 1% or higher
                  })
                  .map((job, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {job.job && (
                            <h4 className="font-semibold text-gray-900 text-base mb-2">
                              {job.job}
                            </h4>
                          )}
                          <p className="font-medium text-gray-900 text-sm leading-relaxed">
                            {job.job_statement}
                          </p>
                        </div>
                        <BadgeTooltip type="percentage" value={job.percentage}>
                          <span
                            className="text-xs px-2 py-1 rounded-full font-medium ml-3"
                            style={{
                              backgroundColor: colors.bg,
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            {job.percentage}
                          </span>
                        </BadgeTooltip>
                      </div>

                      <div className="flex items-center space-x-2">
                        {job.importance && (
                          <BadgeTooltip
                            type="importance"
                            value={job.importance}
                          >
                            <Badge
                              variant={
                                job.importance === "High"
                                  ? "destructive"
                                  : job.importance === "Medium"
                                    ? "default"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {job.importance}
                            </Badge>
                          </BadgeTooltip>
                        )}
                      </div>

                      <p className="text-sm text-gray-700">{job.summary}</p>

                      {job.example_quote && (
                        <div className={`${QUOTE_STYLES.container}`}>
                          <div className="flex items-start space-x-2">
                            <Quote className={`${QUOTE_STYLES.icon} mt-0.5`} />
                            <p className={`${QUOTE_STYLES.text}`}>
                              "{job.example_quote}"
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

      {/* Strategic Insights with Clean Design */}
      <div
        className={`${CLEAN_CARD_STYLES.base} ${CLEAN_CARD_STYLES.padding}`}
        style={{ backgroundColor: ANALYSIS_COLORS.strength.bg }}
      >
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: ANALYSIS_COLORS.strength.text }}
        >
          Strategic JTBD Insights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center mb-2">
              <Wrench className="h-5 w-5 text-blue-600 mr-2" />
              <h4 className="font-semibold text-gray-900">Functional Focus</h4>
            </div>
            <p className="text-sm text-gray-700">
              Address the core functional jobs to ensure your product solves
              real problems effectively.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
            <div className="flex items-center mb-2">
              <Heart className="h-5 w-5 text-red-600 mr-2" />
              <h4 className="font-semibold text-gray-900">
                Emotional Connection
              </h4>
            </div>
            <p className="text-sm text-gray-700">
              Build emotional satisfaction to create deeper customer loyalty and
              preference.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
            <div className="flex items-center mb-2">
              <Users2 className="h-5 w-5 text-green-600 mr-2" />
              <h4 className="font-semibold text-gray-900">Social Impact</h4>
            </div>
            <p className="text-sm text-gray-700">
              Leverage social jobs to encourage word-of-mouth and community
              building.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
