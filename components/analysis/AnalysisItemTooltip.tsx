// components/analysis/AnalysisItemTooltip.tsx
"use client";

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AnalysisItemTooltipProps {
  children: React.ReactNode;
  importance?: string;
  percentage?: string;
  trend?: {
    status?: string;
    trend_summary?: string;
  };
}

export function AnalysisItemTooltip({ 
  children, 
  importance, 
  percentage, 
  trend 
}: AnalysisItemTooltipProps) {
  // If no data to show, just return children
  if (!importance && !percentage && !trend) {
    return <>{children}</>;
  }

  const getTrendLabel = (status?: string) => {
    switch(status) {
      case 'STABLE': return 'Stable';
      case 'IMPROVING': return 'Improving';
      case 'DECLINING': return 'Declining';
      case 'RESOLVED': return 'Resolved';
      case 'EMERGING': return 'Emerging';
      default: return status || 'Unknown';
    }
  };

  const getImportanceDescription = (level?: string) => {
    switch(level?.toLowerCase()) {
      case 'high': return 'Mentioned by 15% or more of reviewers';
      case 'medium': return 'Mentioned by 5-14.9% of reviewers';
      case 'low': return 'Mentioned by less than 5% of reviewers';
      default: return '';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            {percentage && (
              <div>
                <span className="font-semibold">Representing:</span>
                <span className="ml-2">{percentage} of reviews</span>
              </div>
            )}
            
            {importance && (
              <div>
                <span className="font-semibold">Importance:</span>
                <span className="ml-2">{importance}</span>
                {getImportanceDescription(importance) && (
                  <div className="text-xs text-gray-500 mt-1">
                    {getImportanceDescription(importance)}
                  </div>
                )}
              </div>
            )}
            
            {trend && trend.status && (
              <div>
                <span className="font-semibold">Trend Over Time:</span>
                <span className="ml-2">{getTrendLabel(trend.status)}</span>
                {trend.trend_summary && (
                  <div className="text-xs text-gray-500 mt-1">
                    {trend.trend_summary}
                  </div>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}