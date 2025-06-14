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

    return {
      labels: swotData.map((item) => item.topic),
      datasets: [
        {
          data: swotData.map((item) =>
            parseFloat(item.percentage.replace("%", "")),
          ),
          backgroundColor: colors.slice(0, swotData.length),
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
        position: "bottom" as const,
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {sections.map((section) => (
        <div key={section.key} className="space-y-2">
          <h3 className="text-lg font-semibold text-center">{section.title}</h3>
          <div style={{ height: "250px" }}>
            <Doughnut
              data={createChartData(
                section.data,
                section.title,
                section.colors,
              )}
              options={options}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
