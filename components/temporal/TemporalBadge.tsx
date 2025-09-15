// components/temporal/TemporalBadge.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TemporalStatus } from "@/lib/types/temporal";
import {
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Minus,
} from "lucide-react";

interface TemporalBadgeProps {
  status: TemporalStatus;
  size?: "sm" | "default" | "lg";
  showIcon?: boolean;
  className?: string;
}

const getStatusConfig = (status: TemporalStatus) => {
  switch (status) {
    case 'RESOLVED':
      return {
        icon: CheckCircle,
        label: 'Resolved',
        className: 'bg-green-100 text-green-800 border-green-300',
        description: 'Issue has been addressed and is no longer mentioned'
      };
    case 'CURRENT':
      return {
        icon: AlertCircle,
        label: 'Current',
        className: 'bg-orange-100 text-orange-800 border-orange-300',
        description: 'Active issue being mentioned currently'
      };
    case 'IMPROVING':
      return {
        icon: TrendingUp,
        label: 'Improving',
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        description: 'Trend shows positive improvement over time'
      };
    case 'DECLINING':
      return {
        icon: TrendingDown,
        label: 'Declining',
        className: 'bg-red-100 text-red-800 border-red-300',
        description: 'Trend shows negative change over time'
      };
    case 'EMERGING':
      return {
        icon: Zap,
        label: 'Emerging',
        className: 'bg-purple-100 text-purple-800 border-purple-300',
        description: 'New issue or trend appearing recently'
      };
    case 'STABLE':
      return {
        icon: Minus,
        label: 'Stable',
        className: 'bg-gray-100 text-gray-800 border-gray-300',
        description: 'Consistent mentions over time with no significant change'
      };
    default:
      return {
        icon: AlertCircle,
        label: 'Unknown',
        className: 'bg-gray-100 text-gray-800 border-gray-300',
        description: 'Status not determined'
      };
  }
};

const getSizeClasses = (size: "sm" | "default" | "lg") => {
  switch (size) {
    case 'sm':
      return 'text-xs px-2 py-0.5';
    case 'lg':
      return 'text-sm px-3 py-1.5';
    default:
      return 'text-xs px-2.5 py-1';
  }
};

export function TemporalBadge({ 
  status, 
  size = "default", 
  showIcon = true,
  className 
}: TemporalBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  const sizeClasses = getSizeClasses(size);

  return (
    <Badge
      variant="secondary"
      className={cn(
        config.className,
        sizeClasses,
        'border font-medium',
        className
      )}
      title={config.description}
    >
      {showIcon && (
        <Icon className={cn(
          'flex-shrink-0',
          size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5',
          'mr-1'
        )} />
      )}
      {config.label}
    </Badge>
  );
}