// components/temporal/TemporalTimeline.tsx
"use client";

import { cn } from "@/lib/utils";
import { TemporalTrend, TemporalTimelineEntry } from "@/lib/types/temporal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Clock, Info } from "lucide-react";
import { TemporalBadge } from "./TemporalBadge";
import { TrendIndicator } from "./TrendIndicator";

interface TemporalTimelineProps {
  trend: TemporalTrend;
  theme: string;
  size?: "sm" | "default" | "lg";
  showDetails?: boolean;
  className?: string;
}

const getFrequencyColor = (frequency: number, maxFrequency: number) => {
  const percentage = frequency / maxFrequency;

  if (percentage > 0.7) return "bg-red-500";
  if (percentage > 0.4) return "bg-orange-500";
  if (percentage > 0.2) return "bg-yellow-500";
  if (percentage > 0) return "bg-blue-500";
  return "bg-gray-300";
};

const formatPeriod = (period: string) => {
  // Handle different period formats
  if (period.match(/^\d{4}$/)) {
    return period; // Just year
  }
  if (period.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = period.split("-");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }
  return period; // Return as is if format is unknown
};

export function TemporalTimeline({
  trend,
  theme,
  size = "default",
  showDetails = true,
  className,
}: TemporalTimelineProps) {
  const { status, timeline, last_mentioned, trend_summary } = trend;

  if (!timeline || timeline.length === 0) {
    return (
      <div className={cn("text-sm text-gray-500", className)}>
        No timeline data available
      </div>
    );
  }

  const maxFrequency = Math.max(...timeline.map((entry) => entry.frequency));
  const isCompact = size === "sm";

  if (isCompact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <TrendIndicator status={status} timeline={timeline} size="sm" />
        <TemporalBadge status={status} size="sm" />
        {last_mentioned && status === "RESOLVED" && (
          <Badge variant="outline" className="text-xs">
            Last: {last_mentioned}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("border border-gray-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-600" />
            <CardTitle className="text-sm font-medium">
              Temporal Trend: {theme}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <TrendIndicator status={status} timeline={timeline} size="sm" />
            <TemporalBadge status={status} size="sm" />
          </div>
        </div>
        {trend_summary && (
          <CardDescription className="text-xs">{trend_summary}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Timeline visualization */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Timeline</span>
            <span>Frequency</span>
          </div>

          <div className="space-y-2">
            {timeline.map((entry, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="text-xs text-gray-600 min-w-[60px]">
                  {formatPeriod(entry.period)}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 relative overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        getFrequencyColor(entry.frequency, maxFrequency),
                      )}
                      style={{
                        width:
                          maxFrequency > 0
                            ? `${(entry.frequency / maxFrequency) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 min-w-[30px] text-right">
                    {entry.frequency}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional information */}
          {(last_mentioned || showDetails) && (
            <div className="border-t pt-3 mt-3 space-y-2">
              {last_mentioned && status === "RESOLVED" && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="h-3 w-3" />
                  <span>Last mentioned: {last_mentioned}</span>
                </div>
              )}

              {showDetails && trend_summary && (
                <div className="flex items-start gap-2 text-xs text-gray-600">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{trend_summary}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
