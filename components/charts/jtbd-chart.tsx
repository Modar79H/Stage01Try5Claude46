// components/charts/jtbd-chart.tsx
"use client";

import { useRef } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface JTBDChartProps {
  data: {
    functional_jobs?: Array<{
      job?: string;
      job_statement: string;
      percentage: string;
    }>;
    emotional_jobs?: Array<{
      job?: string;
      job_statement: string;
      percentage: string;
    }>;
    social_jobs?: Array<{
      job?: string;
      job_statement: string;
      percentage: string;
    }>;
  };
}

export function JTBDChart({ data }: JTBDChartProps) {
  const chartRef = useRef<ChartJS<"doughnut", number[], string>>(null);

  const createChartData = (
    jobData: Array<{
      job?: string;
      job_statement: string;
      percentage: string;
    }> = [],
    title: string,
    baseColor: string,
  ) => {
    if (jobData.length === 0) {
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

    // Generate color variations based on base color
    const generateColors = (base: string, count: number) => {
      const colors = [];
      const hues = {
        "#104862": [200, 210, 190], // Blue-green variations
        "#E97132": [20, 30, 10], // Orange variations
        "#1A5A7A": [200, 210, 190], // Blue-green variations
      };

      const baseHues = hues[base as keyof typeof hues] || [210, 220, 200];

      for (let i = 0; i < count; i++) {
        const hue = baseHues[i % baseHues.length];
        const saturation = 70 - i * 10;
        const lightness = 50 + i * 5;
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
      }
      return colors;
    };

    // Sort data by percentage in descending order
    const sortedData = [...jobData].sort((a, b) => {
      const aValue = a.percentage
        ? parseFloat(a.percentage.replace("%", ""))
        : 0;
      const bValue = b.percentage
        ? parseFloat(b.percentage.replace("%", ""))
        : 0;
      return bValue - aValue;
    });

    return {
      labels: sortedData.map((item) => {
        // Use job name if available, otherwise truncate job statement
        if (item.job) {
          return item.job.length > 40
            ? item.job.substring(0, 40) + "..."
            : item.job;
        }
        const statement = item.job_statement.replace(/"/g, "");
        return statement.length > 40
          ? statement.substring(0, 40) + "..."
          : statement;
      }),
      datasets: [
        {
          data: sortedData.map((item) =>
            item.percentage ? parseFloat(item.percentage.replace("%", "")) : 0,
          ),
          backgroundColor: generateColors(baseColor, sortedData.length),
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
            const fullLabel = context.chart.data.labels[context.dataIndex];
            return `${context.parsed}%: ${fullLabel}`;
          },
        },
      },
    },
    cutout: "50%",
  };

  const sections = [
    {
      key: "functional_jobs",
      title: "Functional Jobs",
      data: data.functional_jobs || [],
      color: "#104862",
    },
    {
      key: "emotional_jobs",
      title: "Emotional Jobs",
      data: data.emotional_jobs || [],
      color: "#E97132",
    },
    {
      key: "social_jobs",
      title: "Social Jobs",
      data: data.social_jobs || [],
      color: "#1A5A7A",
    },
  ];

  const CustomLegend = ({
    data,
    baseColor,
  }: {
    data: any;
    baseColor: string;
  }) => {
    if (
      !data.labels ||
      data.labels.length === 0 ||
      data.labels[0] === "No data"
    ) {
      return (
        <div className="text-center text-gray-500 text-sm">
          No data available
        </div>
      );
    }

    return (
      <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
        <div className="space-y-1">
          {data.labels.map((label: string, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: data.datasets[0].backgroundColor[index],
                }}
              ></div>
              <span className="truncate flex-1" title={label}>
                {label}
              </span>
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {sections.map((section) => {
        const chartData = createChartData(
          section.data,
          section.title,
          section.color,
        );
        return (
          <div key={section.key} className="space-y-3">
            <h3 className="text-lg font-semibold text-center">
              {section.title}
            </h3>
            <div style={{ height: "200px" }}>
              <Doughnut data={chartData} options={options} />
            </div>
            <CustomLegend data={chartData} baseColor={section.color} />
          </div>
        );
      })}
    </div>
  );
}
