"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  BubbleDataPoint,
  Point,
} from "chart.js";
import { Scatter } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface RatingChartProps {
  data: {
    ratings: Array<{
      rating: number;
      count: number;
      percentage: string;
      top_themes: Array<{
        theme: string;
        frequency: string;
      }>;
    }>;
  };
}

export function RatingChart({ data }: RatingChartProps) {
  const chartRef = useRef<any>(null);

  const chartData: ChartData<"scatter"> = {
    datasets: data.ratings.map((rating) => ({
      label: `${rating.rating} Star${rating.rating !== 1 ? "s" : ""} (${rating.percentage})`,
      data: rating.top_themes.map(
        (theme, index) =>
          ({
            x: rating.rating,
            y: index + 1,
            theme: theme.theme,
            frequency: theme.frequency,
          }) as any,
      ),
      backgroundColor:
        rating.rating >= 4
          ? "rgba(16, 72, 98, 0.6)" // #104862 with opacity
          : rating.rating === 3
            ? "rgba(233, 113, 50, 0.6)" // #E97132 with opacity
            : "rgba(233, 113, 50, 0.8)", // #E97132 with more opacity
      borderColor: rating.rating >= 4 ? "#104862" : "#E97132",
      borderWidth: 2,
      pointRadius: (context: any) => {
        const point = context.raw as any;
        const freq = parseFloat(point?.frequency?.replace("%", "") || "0");
        return Math.max(5, Math.min(15, freq / 2));
      },
      pointHoverRadius: (context: any) => {
        const point = context.raw as any;
        const freq = parseFloat(point?.frequency?.replace("%", "") || "0");
        return Math.max(7, Math.min(17, freq / 2 + 2));
      },
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const point = context.raw as any;
            return [
              `Theme: ${point.theme}`,
              `Frequency: ${point.frequency}`,
              `Rating: ${point.x} stars`,
            ];
          },
        },
      },
      title: {
        display: true,
        text: "Top Themes by Rating",
        font: {
          size: 16,
        },
        color: "#104862",
      },
    },
    scales: {
      x: {
        type: "linear" as const,
        position: "bottom" as const,
        min: 0.5,
        max: 5.5,
        ticks: {
          stepSize: 1,
          min: 1,
          max: 5,
          callback: function (value: any) {
            if (Number.isInteger(value) && value >= 1 && value <= 5) {
              return value + " ★";
            }
            return "";
          },
        },
        grid: {
          display: true,
          drawTicks: false,
          color: function (context: any) {
            if (context.tick.value === 0 || context.tick.value === 5) {
              return "rgba(0, 0, 0, 0.1)";
            }
            return "transparent";
          },
        },
        title: {
          display: true,
          text: "Rating",
          font: {
            weight: "bold",
          },
          color: "#104862",
        },
      },
      y: {
        type: "linear" as const,
        min: 0.5,
        max: Math.max(...data.ratings.map((r) => r.top_themes.length)) + 0.5,
        ticks: {
          display: false,
        },
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: "Themes",
          font: {
            weight: "bold",
          },
          color: "#104862",
        },
      },
    },
  };

  return (
    <div className="h-[400px]">
      <Scatter ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
