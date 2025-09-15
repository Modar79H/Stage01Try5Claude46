# Temporal Context Components

This directory contains reusable React components for displaying temporal context in analysis data. These components help visualize how themes, issues, and trends change over time in customer feedback and analysis data.

## Components

### TemporalBadge

A badge component that displays the current temporal status of a theme or issue.

**Props:**
- `status`: TemporalStatus - The temporal status ('RESOLVED' | 'CURRENT' | 'IMPROVING' | 'DECLINING' | 'EMERGING' | 'STABLE')
- `size`: 'sm' | 'default' | 'lg' - Size of the badge
- `showIcon`: boolean - Whether to show the status icon
- `className`: string - Additional CSS classes

**Example:**
```tsx
<TemporalBadge status="IMPROVING" size="sm" />
```

### TrendIndicator

A visual indicator showing the trend direction and status.

**Props:**
- `status`: TemporalStatus - The temporal status
- `timeline`: TemporalTimelineEntry[] - Timeline data for trend calculation
- `size`: 'sm' | 'default' | 'lg' - Size of the indicator
- `variant`: 'icon' | 'arrow' | 'both' - Display variant
- `className`: string - Additional CSS classes

**Example:**
```tsx
<TrendIndicator 
  status="IMPROVING" 
  timeline={[
    {period: "2022", frequency: 35},
    {period: "2023", frequency: 20},
    {period: "2024", frequency: 5}
  ]}
  size="sm" 
/>
```

### TemporalTimeline

A comprehensive timeline visualization showing frequency changes over time.

**Props:**
- `trend`: TemporalTrend - Complete trend data
- `theme`: string - Theme name for display
- `size`: 'sm' | 'default' | 'lg' - Size of the timeline
- `showDetails`: boolean - Whether to show detailed information
- `className`: string - Additional CSS classes

**Example:**
```tsx
<TemporalTimeline 
  trend={{
    status: "IMPROVING",
    timeline: [
      {period: "2022", frequency: 35},
      {period: "2023", frequency: 20},
      {period: "2024", frequency: 5}
    ],
    trend_summary: "Issue frequency has decreased significantly over time",
    last_mentioned: "March 2023"
  }}
  theme="Odor Issues"
  showDetails={true}
/>
```

## Status Types

### TemporalStatus

- **RESOLVED**: Issue has been addressed and is no longer mentioned in recent reviews
- **CURRENT**: Issue is actively being mentioned in current reviews
- **IMPROVING**: Trend shows positive improvement over time
- **DECLINING**: Trend shows negative change over time  
- **EMERGING**: New issue or trend appearing in recent reviews
- **STABLE**: Consistent mentions over time with no significant change

## Data Structure

### TemporalTrend

```typescript
interface TemporalTrend {
  status: TemporalStatus;
  timeline: TemporalTimelineEntry[];
  last_mentioned?: string; // For resolved issues
  trend_summary: string;
}
```

### TemporalTimelineEntry

```typescript
interface TemporalTimelineEntry {
  period: string; // e.g., "2024", "2024-03", "Q1 2024"
  frequency: number; // Number of mentions in that period
}
```

## Integration with Analysis Components

All analysis components have been updated to support temporal context:

1. **Sentiment Analysis**: Shows temporal trends for likes and dislikes
2. **Rating Analysis**: Displays trends for rating themes
3. **SWOT Analysis**: Shows temporal context for strengths, weaknesses, opportunities, threats
4. **JTBD Analysis**: Displays trends for functional, emotional, and social jobs
5. **STP Analysis**: Shows temporal trends for market segments
6. **Customer Journey**: Displays trends across journey stages
7. **Four W Matrix**: Shows temporal context for who, what, where, when insights

## Usage Example in Analysis Components

```tsx
// In any analysis component
{item.temporal_trend && (
  <div className="flex items-center gap-2">
    <TrendIndicator 
      status={item.temporal_trend.status} 
      timeline={item.temporal_trend.timeline}
      size="sm"
    />
    <TemporalBadge 
      status={item.temporal_trend.status} 
      size="sm"
    />
  </div>
)}

{item.temporal_trend?.trend_summary && (
  <div className="text-sm text-gray-600 italic">
    <strong>Trend:</strong> {item.temporal_trend.trend_summary}
    {item.temporal_trend.last_mentioned && item.temporal_trend.status === 'RESOLVED' && (
      <span className="ml-2 text-green-600">
        (Last mentioned: {item.temporal_trend.last_mentioned})
      </span>
    )}
  </div>
)}
```

## Styling

All components use Tailwind CSS classes and support dark mode through the `dark:` prefix. They integrate seamlessly with the existing UI component system and maintain consistent styling across the application.

## Backwards Compatibility

All temporal features are optional and backwards compatible. Components will continue to work normally if temporal data is not provided - the temporal indicators simply won't be displayed.