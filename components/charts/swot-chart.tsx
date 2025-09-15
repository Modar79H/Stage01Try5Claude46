// components/charts/swot-chart.tsx
"use client";

import { useRef } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface SWOTChartProps {
  data: {
    strengths?: Array<{ topic: string; percentage: string }>;
    weaknesses?: Array<{ topic: string; percentage: string }>;
    opportunities?: Array<{ topic: string; percentage: string }>;
    threats?: Array<{ topic: string; percentage: string }>;
  };
}

export function SWOTChart({ data }: SWOTChartProps) {
  const chartRef = useRef<ChartJS<"doughnut", number[], string>>(null);

  const createChartData = (
    swotData: Array<{ topic: string; percentage: string }> = [],
    title: string,
    colors: string[],
  ) => {
    if (swotData.length === 0) {
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
    const sortedData = [...swotData].sort((a, b) => {
      const aValue = a.percentage ? parseFloat(a.percentage.replace("%", "")) : 0;
      const bValue = b.percentage ? parseFloat(b.percentage.replace("%", "")) : 0;
      return bValue - aValue;
    });

    return {
      labels: sortedData.map((item) => item.topic),
      datasets: [
        {
          data: sortedData.map((item) =>
            item.percentage ? parseFloat(item.percentage.replace("%", "")) : 0,
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
            return `${context.label}: ${context.parsed}%`;
          },
        },
      },
    },
    cutout: "50%",
  };

  const sections = [
    {
      key: "strengths",
      title: "Strengths",
      data: data.strengths || [],
      colors: ["#10B981", "#059669", "#047857", "#065F46", "#064E3B"],
    },
    {
      key: "weaknesses",
      title: "Weaknesses",
      data: data.weaknesses || [],
      colors: ["#EF4444", "#DC2626", "#B91C1C", "#991B1B", "#7F1D1D"],
    },
    {
      key: "opportunities",
      title: "Opportunities",
      data: data.opportunities || [],
      colors: ["#3B82F6", "#2563EB", "#1D4ED8", "#1E40AF", "#1E3A8A"],
    },
    {
      key: "threats",
      title: "Threats",
      data: data.threats || [],
      colors: ["#F59E0B", "#D97706", "#B45309", "#92400E", "#78350F"],
    },
  ];

  const CustomLegend = ({ data, colors }: { data: any; colors: string[] }) => {
    if (!data.labels || data.labels.length === 0 || data.labels[0] === "No data") {
      return <div className="text-center text-gray-500 text-sm">No data available</div>;
    }

    return (
      <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-gray-800">
        <div className="space-y-1">
          {data.labels.map((label: string, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: colors[index] }}
              ></div>
              <span className="truncate flex-1" title={label}>{label}</span>
              <span className="text-gray-600 dark:text-gray-400 font-medium">
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
        const chartData = createChartData(
          section.data,
          section.title,
          section.colors,
        );
        return (
          <div key={section.key} className="space-y-3">
            <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white">{section.title}</h3>
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm" style={{ height: "200px" }}>
              <Doughnut
                data={chartData}
                options={options}
              />
            </div>
            <CustomLegend data={chartData} colors={section.colors} />
          </div>
        );
      })}
    </div>
  );
}
