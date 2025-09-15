// components/charts/four-w-chart.tsx
"use client";

import { useRef } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface FourWChartProps {
  data: {
    who?: Array<{ topic: string; percentage: string }>;
    what?: Array<{ topic: string; percentage: string }>;
    where?: Array<{ topic: string; percentage: string }>;
    when?: Array<{ topic: string; percentage: string }>;
  };
}

export function FourWChart({ data }: FourWChartProps) {
  const chartRef = useRef<ChartJS<"doughnut", number[], string>>(null);

  const colors = [
    "#104862",
    "#E97132",
    "#1A5A7A",
    "#F08040",
    "#0C3448",
    "#EC5820",
    "#2B6E90",
    "#F4955A",
    "#083042",
    "#E84510",
  ];

  const createChartData = (
    sectionData: Array<{ topic: string; percentage: string }> = [],
    title: string,
  ) => {
    // Filter out topics with percentage < 1% or no percentage for chart display
    const chartData = sectionData.filter((item) => {
      if (!item.percentage) return false; // Exclude topics without percentage from chart
      const value = parseFloat(item.percentage.replace("%", ""));
      return value >= 1; // Only include topics with 1% or higher
    });

    if (chartData.length === 0) {
      return {
        labels: ["No data"],
        datasets: [
          {
            data: [100],
            backgroundColor: ["#E5E7EB"],
            borderWidth: 0,
          },
        ],
      };
    }

    // Sort data by percentage in descending order
    const sortedData = [...chartData].sort((a, b) => {
      const aValue = parseFloat(a.percentage.replace("%", ""));
      const bValue = parseFloat(b.percentage.replace("%", ""));
      return bValue - aValue;
    });

    return {
      labels: sortedData.map((item) => item.topic),
      datasets: [
        {
          data: sortedData.map((item) =>
            parseFloat(item.percentage.replace("%", ""))
          ),
          backgroundColor: colors.slice(0, sortedData.length),
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Disable default legend, we'll create custom scrollable one
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.label}: ${context.parsed.toFixed(1)}%`;
          },
        },
      },
    },
    cutout: "50%",
  };

  const sections = [
    { key: "who", title: "WHO", data: data.who || [] },
    { key: "what", title: "WHAT", data: data.what || [] },
    { key: "where", title: "WHERE", data: data.where || [] },
    { key: "when", title: "WHEN", data: data.when || [] },
  ];

  const CustomLegend = ({ data, colors }: { data: any; colors: string[] }) => {
    if (!data.labels || data.labels.length === 0 || data.labels[0] === "No data") {
      return <div className="text-center text-gray-500 text-sm">No data available</div>;
    }

    return (
      <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
        <div className="space-y-1">
          {data.labels.map((label: string, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: colors[index] }}
              ></div>
              <span className="truncate flex-1" title={label}>{label}</span>
              <span className="text-gray-600 font-medium">
                {data.datasets[0]?.data[index]?.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {sections.map((section) => {
        const chartData = createChartData(section.data, section.title);
        return (
          <div key={section.key} className="space-y-3">
            <h3 className="text-lg font-semibold text-center">{section.title}</h3>
            <div style={{ height: "200px" }}>
              <Doughnut data={chartData} options={options} />
            </div>
            <CustomLegend data={chartData} colors={colors} />
          </div>
        );
      })}
    </div>
  );
}
