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
    if (sectionData.length === 0) {
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
      labels: sectionData.map((item) => item.topic),
      datasets: [
        {
          data: sectionData.map((item) =>
            parseFloat(item.percentage.replace("%", "")),
          ),
          backgroundColor: colors.slice(0, sectionData.length),
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
    { key: "who", title: "WHO", data: data.who || [] },
    { key: "what", title: "WHAT", data: data.what || [] },
    { key: "where", title: "WHERE", data: data.where || [] },
    { key: "when", title: "WHEN", data: data.when || [] },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {sections.map((section) => (
        <div key={section.key} className="space-y-2">
          <h3 className="text-lg font-semibold text-center">{section.title}</h3>
          <div style={{ height: "250px" }}>
            <Doughnut
              data={createChartData(section.data, section.title)}
              options={options}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
