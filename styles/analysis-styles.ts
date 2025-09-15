// styles/analysis-styles.ts
// Standardized design system based on clean SWOT analysis design

export const ANALYSIS_COLORS = {
  // Muted color palette based on SWOT design
  strength: {
    bg: "#e8f6f0",
    text: "#065f46",
    border: "#10b981",
    icon: "#059669",
  },
  weakness: {
    bg: "#fef2f2",
    text: "#991b1b",
    border: "#ef4444",
    icon: "#dc2626",
  },
  opportunity: {
    bg: "#e8f4f8",
    text: "#1e40af",
    border: "#3b82f6",
    icon: "#2563eb",
  },
  threat: {
    bg: "#fef3e8",
    text: "#ea580c",
    border: "#f97316",
    icon: "#ea580c",
  },

  // General colors
  card: {
    bg: "#ffffff",
    border: "#e5e7eb",
    shadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  text: {
    primary: "#374151",
    secondary: "#6b7280",
    muted: "#9ca3af",
  },
  quote: {
    bg: "#eff6ff",
    border: "#bfdbfe",
    text: "#1e40af",
  },
} as const;

export const CLEAN_CARD_STYLES = {
  base: "bg-white border border-gray-200 rounded-lg shadow-sm",
  padding: "p-6",
  hover: "hover:shadow-md transition-shadow duration-200",
  spacing: "space-y-4",
} as const;

export const HEADER_STYLES = {
  container: "flex items-center justify-between mb-4",
  title: "font-semibold text-gray-900 text-lg",
  subtitle: "text-sm text-gray-600",
  percentage: "text-xs font-medium px-2 py-1 rounded-full",
} as const;

export const QUOTE_STYLES = {
  container: "bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3",
  text: "text-sm text-blue-800 italic",
  icon: "text-blue-600 h-4 w-4 flex-shrink-0",
} as const;

// Helper functions for consistent styling
export const getColoredHeaderStyles = (
  type: "strength" | "weakness" | "opportunity" | "threat",
) => {
  const colors = ANALYSIS_COLORS[type];
  return {
    backgroundColor: colors.bg,
    color: colors.text,
    borderLeft: `4px solid ${colors.border}`,
  };
};

export const getPercentageBadgeStyles = (
  type: "strength" | "weakness" | "opportunity" | "threat",
) => {
  const colors = ANALYSIS_COLORS[type];
  return {
    backgroundColor: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
  };
};
