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
  Lightbulb,
  TrendingUp,
  Brain,
} from "lucide-react";
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
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-500",
        badgeColor: "bg-blue-100 text-blue-800",
        gradientColors: "from-blue-500 to-indigo-500",
      };
    case "emotional":
      return {
        icon: <Heart className="h-5 w-5" />,
        title: "Emotional Jobs",
        description: "Feelings and emotional outcomes desired",
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-500",
        badgeColor: "bg-red-100 text-red-800",
        gradientColors: "from-red-500 to-pink-500",
      };
    case "social":
      return {
        icon: <Users2 className="h-5 w-5" />,
        title: "Social Jobs",
        description: "Social status and reputation needs",
        color: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-500",
        badgeColor: "bg-green-100 text-green-800",
        gradientColors: "from-green-500 to-emerald-500",
      };
    default:
      return {
        icon: <Target className="h-5 w-5" />,
        title: "Jobs",
        description: "",
        color: "text-gray-700",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-500",
        badgeColor: "bg-gray-100 text-gray-800",
        gradientColors: "from-gray-500 to-gray-600",
      };
  }
};

export function JTBDAnalysis({ analysis }: JTBDAnalysisProps) {
  if (!analysis || analysis.status !== "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 mr-3">
              <Target className="h-5 w-5 text-white" />
            </div>
            Jobs to be Done Analysis
          </CardTitle>
          <CardDescription>
            Understanding why customers hire your product
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
                <p className="text-gray-600 dark:text-gray-400">
                  Analysis in progress...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const data = analysis.data?.jtbd_analysis;

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 mr-3">
              <Target className="h-5 w-5 text-white" />
            </div>
            Jobs to be Done Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">No JTBD data available.</p>
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
      {/* Charts Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 mr-3">
              <Target className="h-5 w-5 text-white" />
            </div>
            JTBD Distribution
          </CardTitle>
          <CardDescription>
            Visual breakdown of functional, emotional, and social jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JTBDChart data={data} />
        </CardContent>
      </Card>

      {/* Detailed Job Type Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {jobTypes.map((jobType) => {
          if (!jobType.data || jobType.data.length === 0) return null;

          const typeInfo = getJobTypeInfo(jobType.key);

          return (
            <Card key={jobType.key}>
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-r ${typeInfo.gradientColors} mr-3`}
                  >
                    <div className="text-white">{typeInfo.icon}</div>
                  </div>
                  <span>{typeInfo.title}</span>
                </CardTitle>
                <CardDescription>{typeInfo.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobType.data
                    .filter((job: any) => {
                      if (!job.percentage) return true;
                      const value = parseFloat(job.percentage.replace('%', ''));
                      return value >= 1;
                    })
                    .sort((a: any, b: any) => {
                      const aValue = parseFloat(a.percentage?.replace('%', '') || '0');
                      const bValue = parseFloat(b.percentage?.replace('%', '') || '0');
                      return bValue - aValue;
                    })
                    .map((job, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-gradient-primary pl-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-r-lg p-4 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          {job.job && (
                            <h4 className="font-semibold text-base text-gray-900 dark:text-white mb-2">
                              {job.job}
                            </h4>
                          )}
                          <p className="font-medium text-gray-900 dark:text-white text-sm leading-relaxed">
                            {job.job_statement}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          {job.importance && (
                            <BadgeTooltip type="importance" value={job.importance}>
                              <Badge
                                variant={
                                  job.importance === "High"
                                    ? "destructive"
                                    : job.importance === "Medium"
                                      ? "default"
                                      : "secondary"
                                }
                                size="sm"
                              >
                                {job.importance}
                              </Badge>
                            </BadgeTooltip>
                          )}
                          <BadgeTooltip type="percentage" value={job.percentage}>
                            <Badge
                              variant={
                                jobType.key === "functional"
                                  ? "info"
                                  : jobType.key === "emotional"
                                    ? "destructive"
                                    : "success"
                              }
                              size="sm"
                            >
                              {job.percentage || 'Calculating...'}
                            </Badge>
                          </BadgeTooltip>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                        {job.summary}
                      </p>
                      {job.example_quote && (
                        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <Quote className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                            <p className="italic text-sm text-gray-700 dark:text-gray-300">
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

      {/* Strategic Implications */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
        <CardHeader>
          <CardTitle className="text-indigo-900 dark:text-indigo-100 flex items-center">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 mr-3">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            Strategic JTBD Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20 dark:border-gray-700/20 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center mr-3">
                  <Wrench className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-100">
                  Functional Focus
                </h4>
              </div>
              <ul className="text-sm space-y-2">
                {data.functional_jobs &&
                  data.functional_jobs.slice(0, 2).map((job, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-indigo-800 dark:text-indigo-200">
                        Enhance {job.job_statement.toLowerCase().split(' ')[3] || 'core functionality'}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20 dark:border-gray-700/20 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center mr-3">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-100">
                  Emotional Connection
                </h4>
              </div>
              <ul className="text-sm space-y-2">
                {data.emotional_jobs &&
                  data.emotional_jobs.slice(0, 2).map((job, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-indigo-800 dark:text-indigo-200">
                        Build loyalty through emotional satisfaction
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-white/20 dark:border-gray-700/20 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mr-3">
                  <Users2 className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-100">
                  Social Impact
                </h4>
              </div>
              <ul className="text-sm space-y-2">
                {data.social_jobs &&
                  data.social_jobs.slice(0, 2).map((job, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-indigo-800 dark:text-indigo-200">
                        Leverage social validation for growth
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
