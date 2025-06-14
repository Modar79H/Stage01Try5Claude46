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
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
    "#84CC16",
    "#F97316",
    "#EC4899",
    "#6366F1",
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
