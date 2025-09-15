// lib/types/temporal.ts

export type TemporalStatus =
  | "RESOLVED"
  | "CURRENT"
  | "IMPROVING"
  | "DECLINING"
  | "EMERGING"
  | "STABLE";

export interface TemporalTimelineEntry {
  period: string;
  frequency: number;
}

export interface TemporalTrend {
  status: TemporalStatus;
  timeline: TemporalTimelineEntry[];
  last_mentioned?: string; // For resolved issues
  trend_summary: string;
}

// Extended interfaces for analysis data with temporal context
export interface TemporalTheme {
  theme: string;
  percentage: string;
  temporal_trend?: TemporalTrend;
}

// Sentiment Analysis with temporal data
export interface SentimentThemeWithTemporal extends TemporalTheme {
  importance: string;
  summary: string;
  example_quote: string;
}

// SWOT Analysis with temporal data
export interface SWOTItemWithTemporal extends TemporalTheme {
  topic: string;
  summary: string;
  example_quote: string;
}

// JTBD Analysis with temporal data
export interface JTBDItemWithTemporal extends TemporalTheme {
  job_statement: string;
  importance: string;
  summary: string;
  example_quote: string;
}

// STP Analysis with temporal data
export interface STPSegmentWithTemporal extends TemporalTheme {
  segment: string;
  description: string;
  attractiveness_factors: string;
  opportunities: string;
  challenges: string;
  example_quote?: string;
  buyer_persona?: any; // Keep existing structure
}

// Customer Journey with temporal data
export interface CustomerJourneyItemWithTemporal extends TemporalTheme {
  topic: string;
  summary: string;
  example_quote: string;
}

// Four W Matrix with temporal data
export interface FourWItemWithTemporal extends TemporalTheme {
  topic: string;
  importance: string;
  summary: string;
  example_quote: string;
}

// Competition Analysis with temporal data
export interface CompetitionItemWithTemporal extends TemporalTheme {
  // Will depend on the actual structure of competition analysis
  [key: string]: any;
}

// Rating Analysis with temporal data
export interface RatingThemeWithTemporal extends TemporalTheme {
  frequency: string;
}
