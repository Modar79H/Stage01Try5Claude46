// components/analysis/BadgeTooltip.tsx
"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BadgeTooltipProps {
  children: React.ReactNode;
  type: "importance" | "percentage" | "trend";
  value?: string;
  description?: string;
}

export function BadgeTooltip({
  children,
  type,
  value,
  description,
}: BadgeTooltipProps) {
  const getTooltipContent = () => {
    switch (type) {
      case "importance":
        const importanceDesc = getImportanceDescription(value);
        return (
          <div>
            <div className="font-semibold">Importance Level</div>
            <div className="text-xs mt-1">{importanceDesc}</div>
          </div>
        );

      case "percentage":
        return (
          <div>
            <div className="font-semibold">Review Coverage</div>
            <div className="text-xs mt-1">
              {value} of customers mentioned this topic
            </div>
          </div>
        );

      case "trend":
        return (
          <div>
            <div className="font-semibold">Trend Over Time</div>
            <div className="text-xs mt-1">{getTrendDescription(value)}</div>
            {description && (
              <div className="text-xs mt-1 text-gray-500">{description}</div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getImportanceDescription = (level?: string) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "Mentioned by 15% or more of reviewers - major concern/strength";
      case "medium":
        return "Mentioned by 5-14.9% of reviewers - moderate significance";
      case "low":
        return "Mentioned by less than 5% of reviewers - minor factor";
      default:
        return "Relative significance of this topic";
    }
  };

  const getTrendDescription = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "stable":
        return "Consistent mentions over time";
      case "improving":
        return "Becoming more positive or less problematic";
      case "declining":
        return "Becoming more negative or problematic";
      case "resolved":
        return "Issue appears to be fixed in recent reviews";
      case "emerging":
        return "New topic appearing in recent reviews";
      default:
        return "Pattern of mentions over time";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">{children}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
