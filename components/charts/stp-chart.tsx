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

  // Sort segments by percentage in descending order
  const sortedSegments = [...segments].sort((a, b) => {
    const aValue = a.percentage ? parseFloat(a.percentage.replace("%", "")) : 0;
    const bValue = b.percentage ? parseFloat(b.percentage.replace("%", "")) : 0;
    return bValue - aValue;
  });

  const data = {
    labels: sortedSegments.map((segment) => segment.segment),
    datasets: [
      {
        data: sortedSegments.map((segment) =>
          segment.percentage ? parseFloat(segment.percentage.replace("%", "")) : 0,
        ),
        backgroundColor: colors.slice(0, sortedSegments.length),
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
    cutout: "40%",
  };

  const CustomLegend = ({ data, colors }: { data: any; colors: string[] }) => {
    return (
      <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50 mt-4">
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
    <div>
      <div style={{ height: "250px" }}>
        <Doughnut ref={chartRef} data={data} options={options} />
      </div>
      <CustomLegend data={data} colors={colors} />
    </div>
  );
}
