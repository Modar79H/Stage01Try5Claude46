// components/temporal/TrendIndicator.tsx
"use client";

import { cn } from "@/lib/utils";
import { TemporalStatus, TemporalTimelineEntry } from "@/lib/types/temporal";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Zap,
  Minus,
} from "lucide-react";

interface TrendIndicatorProps {
  status: TemporalStatus;
  timeline?: TemporalTimelineEntry[];
  size?: "sm" | "default" | "lg";
  variant?: "icon" | "arrow" | "both";
  className?: string;
}

const getIndicatorConfig = (status: TemporalStatus, timeline?: TemporalTimelineEntry[]) => {
  // Calculate trend direction from timeline if available
  let trendDirection: 'up' | 'down' | 'stable' = 'stable';
  
  if (timeline && timeline.length >= 2) {
    const recent = timeline[timeline.length - 1].frequency;
    const previous = timeline[timeline.length - 2].frequency;
    
    if (recent > previous) trendDirection = 'up';
    else if (recent < previous) trendDirection = 'down';
    else trendDirection = 'stable';
  }

  switch (status) {
    case 'RESOLVED':
      return {
        icon: CheckCircle,
        arrow: ArrowDown,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: 'Resolved - frequency decreased to zero'
      };
    case 'IMPROVING':
      return {
        icon: TrendingUp,
        arrow: ArrowUp,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        description: 'Improving - positive trend'
      };
    case 'DECLINING':
      return {
        icon: TrendingDown,
        arrow: ArrowDown,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        description: 'Declining - negative trend'
      };
    case 'EMERGING':
      return {
        icon: Zap,
        arrow: ArrowUp,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        description: 'Emerging - new trend appearing'
      };
    case 'STABLE':
      return {
        icon: Minus,
        arrow: ArrowRight,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        description: 'Stable - consistent over time'
      };
    case 'CURRENT':
    default:
      // Use timeline-based direction for current status
      if (trendDirection === 'up') {
        return {
          icon: ArrowUp,
          arrow: ArrowUp,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          description: 'Current - increasing frequency'
        };
      } else if (trendDirection === 'down') {
        return {
          icon: ArrowDown,
          arrow: ArrowDown,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          description: 'Current - decreasing frequency'
        };
      } else {
        return {
          icon: ArrowRight,
          arrow: ArrowRight,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          description: 'Current - stable frequency'
        };
      }
  }
};

const getSizeClasses = (size: "sm" | "default" | "lg") => {
  switch (size) {
    case 'sm':
      return {
        icon: 'h-3 w-3',
        container: 'w-5 h-5'
      };
    case 'lg':
      return {
        icon: 'h-5 w-5',
        container: 'w-8 h-8'
      };
    default:
      return {
        icon: 'h-4 w-4',
        container: 'w-6 h-6'
      };
  }
};

export function TrendIndicator({ 
  status, 
  timeline,
  size = "default", 
  variant = "icon",
  className 
}: TrendIndicatorProps) {
  const config = getIndicatorConfig(status, timeline);
  const sizeClasses = getSizeClasses(size);
  const Icon = variant === "arrow" ? config.arrow : config.icon;
  
  if (variant === "both") {
    return (
      <div 
        className={cn(
          "flex items-center gap-1",
          className
        )}
        title={config.description}
      >
        <div className={cn(
          "flex items-center justify-center rounded-full",
          config.bgColor,
          sizeClasses.container
        )}>
          <config.icon className={cn(config.color, sizeClasses.icon)} />
        </div>
        <config.arrow className={cn(config.color, sizeClasses.icon)} />
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex items-center justify-center rounded-full",
        config.bgColor,
        sizeClasses.container,
        className
      )}
      title={config.description}
    >
      <Icon className={cn(config.color, sizeClasses.icon)} />
    </div>
  );
}