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
      colors: ["#104862", "#1A5A7A", "#0C3448", "#2B6E90", "#083042"],
    },
    {
      key: "weaknesses",
      title: "Weaknesses",
      data: data.weaknesses || [],
      colors: ["#E97132", "#F08040", "#EC5820", "#F4955A", "#E84510"],
    },
    {
      key: "opportunities",
      title: "Opportunities",
      data: data.opportunities || [],
      colors: ["#104862", "#0C3448", "#1A5A7A", "#083042", "#2B6E90"],
    },
    {
      key: "threats",
      title: "Threats",
      data: data.threats || [],
      colors: ["#E97132", "#EC5820", "#F08040", "#E84510", "#F4955A"],
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
