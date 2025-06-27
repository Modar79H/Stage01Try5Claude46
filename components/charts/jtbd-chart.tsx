// components/charts/jtbd-chart.tsx
"use client";

import { useRef } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface JTBDChartProps {
  data: {
    functional_jobs?: Array<{ job_statement: string; percentage: string }>;
    emotional_jobs?: Array<{ job_statement: string; percentage: string }>;
    social_jobs?: Array<{ job_statement: string; percentage: string }>;
  };
}

export function JTBDChart({ data }: JTBDChartProps) {
  const chartRef = useRef<ChartJS<"doughnut", number[], string>>(null);

  const createChartData = (
    jobData: Array<{ job_statement: string; percentage: string }> = [],
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
        "#5546e1": [251, 261, 241], // Purple variations
        "#6b59e6": [251, 261, 241], // Purple variations
        "#4a3ddb": [251, 261, 241], // Purple variations
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

    return {
      labels: jobData.map((item) => {
        // Truncate long job statements for legend
        const statement = item.job_statement.replace(/"/g, "");
        return statement.length > 40
          ? statement.substring(0, 40) + "..."
          : statement;
      }),
      datasets: [
        {
          data: jobData.map((item) =>
            parseFloat(item.percentage.replace("%", "")),
          ),
          backgroundColor: generateColors(baseColor, jobData.length),
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
            size: 11,
          },
          generateLabels: function (chart: any) {
            const original =
              ChartJS.defaults.plugins.legend.labels.generateLabels;
            const labels = original.call(this, chart);

            // Limit to top 5 items to prevent overcrowding
            return labels.slice(0, 5);
          },
        },
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
      color: "#5546e1",
    },
    {
      key: "emotional_jobs",
      title: "Emotional Jobs",
      data: data.emotional_jobs || [],
      color: "#6b59e6",
    },
    {
      key: "social_jobs",
      title: "Social Jobs",
      data: data.social_jobs || [],
      color: "#4a3ddb",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {sections.map((section) => (
        <div key={section.key} className="space-y-2">
          <h3 className="text-lg font-semibold text-center">{section.title}</h3>
          <div style={{ height: "300px" }}>
            <Doughnut
              data={createChartData(section.data, section.title, section.color)}
              options={options}
            />
          </div>
          {section.data.length > 5 && (
            <p className="text-xs text-gray-500 text-center">
              Showing top 5 of {section.data.length} jobs
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
