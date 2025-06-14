// components/analysis/voice-of-customer.tsx
"use client";

import { useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, AlertCircle } from "lucide-react";

interface VoiceOfCustomerProps {
  analysis?: {
    data: {
      voice_of_customer?: {
        keywords: Array<{
          word: string;
          frequency: number;
        }>;
      };
    };
    status: string;
    error?: string;
  };
}

export function VoiceOfCustomer({ analysis }: VoiceOfCustomerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (analysis?.data?.voice_of_customer?.keywords && canvasRef.current) {
      generateWordCloud();
    }
  }, [analysis]);

  const generateWordCloud = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analysis?.data?.voice_of_customer?.keywords) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const keywords = analysis.data.voice_of_customer.keywords;
    const maxFreq = Math.max(...keywords.map((k) => k.frequency));

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = 600;
    ctx.scale(2, 2);

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Colors for words
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

    // Sort keywords by frequency
    const sortedKeywords = keywords
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 50);

    // Simple word cloud layout
    const centerX = canvas.offsetWidth / 2;
    const centerY = 300;

    sortedKeywords.forEach((keyword, index) => {
      const fontSize = Math.max(
        12,
        Math.min(48, (keyword.frequency / maxFreq) * 48),
      );
      const color = colors[index % colors.length];

      ctx.fillStyle = color;
      ctx.font = `${fontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Simple spiral positioning
      const angle = index * 0.5;
      const radius = index * 8 + 20;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.fillText(keyword.word, x, y);
    });
  };

  if (!analysis || analysis.status !== "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Voice of Customer
          </CardTitle>
          <CardDescription>
            Most frequently mentioned keywords and phrases
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analysis?.status === "failed" ? (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Analysis failed: {analysis.error || "Unknown error"}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analysis in progress...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const data = analysis.data.voice_of_customer;

  if (!data?.keywords?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Voice of Customer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No keyword data available.</p>
        </CardContent>
      </Card>
    );
  }

  const topKeywords = data.keywords
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Word Cloud */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Voice of Customer - Word Cloud
          </CardTitle>
          <CardDescription>
            Visual representation of most frequently mentioned terms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white border rounded-lg p-4">
            <canvas
              ref={canvasRef}
              className="w-full"
              style={{ height: "300px" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Top Keywords Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Keywords by Frequency</CardTitle>
          <CardDescription>
            Most mentioned words and phrases in customer reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topKeywords.map((keyword, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">{keyword.word}</span>
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {keyword.frequency}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
