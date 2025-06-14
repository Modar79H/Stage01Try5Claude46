// components/charts/sentiment-chart.tsx
"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface SentimentChartProps {
  likes: Array<{
    theme: string;
    percentage: string;
  }>;
  dislikes: Array<{
    theme: string;
    percentage: string;
  }>;
}

export function SentimentChart({ likes, dislikes }: SentimentChartProps) {
  const chartRef = useRef<ChartJS<"bar", number[], string>>(null);

  // Combine and sort data by percentage
  const allThemes = [
    ...likes.map((item) => ({
      theme: item.theme,
      percentage: parseFloat(item.percentage.replace("%", "")),
      type: "positive",
    })),
    ...dislikes.map((item) => ({
      theme: item.theme,
      percentage: parseFloat(item.percentage.replace("%", "")),
      type: "negative",
    })),
  ].sort((a, b) => b.percentage - a.percentage);

  // Take top 10 themes
  const topThemes = allThemes.slice(0, 10);

  const data = {
    labels: topThemes.map((item) => item.theme),
    datasets: [
      {
        label: "Positive Sentiment",
        data: topThemes.map((item) =>
          item.type === "positive" ? item.percentage : 0,
        ),
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 1,
      },
      {
        label: "Negative Sentiment",
        data: topThemes.map((item) =>
          item.type === "negative" ? -item.percentage : 0,
        ),
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Customer Sentiment by Theme",
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = Math.abs(context.parsed.y);
            const type = context.parsed.y > 0 ? "Positive" : "Negative";
            return `${type}: ${value}%`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return Math.abs(value) + "%";
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
  };

  if (topThemes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-600">
          No sentiment data available for visualization
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: "400px" }}>
      <Bar ref={chartRef} data={data} options={options} />
    </div>
  );
}
