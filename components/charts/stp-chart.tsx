// components/charts/stp-chart.tsx
"use client";

import { useRef } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface STPChartProps {
  segments: Array<{
    segment: string;
    percentage: string;
  }>;
}

export function STPChart({ segments }: STPChartProps) {
  const chartRef = useRef<ChartJS<"doughnut", number[], string>>(null);

  if (!segments || segments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-600">
          No segmentation data available for visualization
        </p>
      </div>
    );
  }

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

  const data = {
    labels: segments.map((segment) => segment.segment),
    datasets: [
      {
        data: segments.map((segment) =>
          parseFloat(segment.percentage.replace("%", "")),
        ),
        backgroundColor: colors.slice(0, segments.length),
        borderWidth: 2,
        borderColor: "#ffffff",
        hoverBorderWidth: 3,
        hoverBorderColor: "#000000",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 14,
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
    cutout: "40%",
  };

  return (
    <div style={{ height: "300px" }}>
      <Doughnut ref={chartRef} data={data} options={options} />
    </div>
  );
}
