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
      colors: ["#5546e1", "#6b59e6", "#4a3ddb", "#7c6fea", "#3d2fd5"],
    },
    {
      key: "weaknesses",
      title: "Weaknesses",
      data: data.weaknesses || [],
      colors: ["#8f84ed", "#a199f0", "#b3aef3", "#6b59e6", "#7c6fea"],
    },
    {
      key: "opportunities",
      title: "Opportunities",
      data: data.opportunities || [],
      colors: ["#2e1ecf", "#1e0cc9", "#4a3ddb", "#3d2fd5", "#5546e1"],
    },
    {
      key: "threats",
      title: "Threats",
      data: data.threats || [],
      colors: ["#6b59e6", "#7c6fea", "#8f84ed", "#a199f0", "#b3aef3"],
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
