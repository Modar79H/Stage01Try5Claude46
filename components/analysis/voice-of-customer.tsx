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

    // Set canvas size with better resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = 800;
    ctx.scale(2, 2);

    // Clear canvas with background
    ctx.fillStyle = "#f9f9f9";
    ctx.fillRect(0, 0, rect.width, 400);

    // Colors using the new brand palette with variations
    const baseColor = "#104862";
    const colors = [
      "#104862", // Main brand color (blue-green)
      "#E97132", // Secondary brand color (orange)
      "#1A5A7A", // Darker blue variant
      "#F08040", // Lighter orange variant
      "#0C3448", // Even darker blue
      "#EC5820", // Darker orange
      "#2B6E90", // Light blue variant
      "#F4955A", // Light orange variant
      "#083042", // Very dark blue
      "#E84510", // Very dark orange
    ];

    // Sort keywords by frequency and take top 40
    const sortedKeywords = keywords
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 40);

    // Improved font sizing with better scaling
    const getFontSize = (frequency: number) => {
      const ratio = frequency / maxFreq;
      return Math.max(14, Math.min(60, ratio * 60 + 14));
    };

    // Better positioning algorithm - grid with spiral fallback
    const centerX = rect.width / 2;
    const centerY = 200;
    const placedWords: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];

    const checkCollision = (
      x: number,
      y: number,
      width: number,
      height: number,
    ) => {
      return placedWords.some(
        (placed) =>
          x < placed.x + placed.width + 5 &&
          x + width + 5 > placed.x &&
          y < placed.y + placed.height + 5 &&
          y + height + 5 > placed.y,
      );
    };

    sortedKeywords.forEach((keyword, index) => {
      const fontSize = getFontSize(keyword.frequency);
      const color = colors[index % colors.length];

      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Measure text
      const metrics = ctx.measureText(keyword.word);
      const textWidth = metrics.width;
      const textHeight = fontSize;

      let placed = false;
      let attempts = 0;
      let x = centerX;
      let y = centerY;

      // Try to place word without collision
      while (!placed && attempts < 100) {
        if (attempts === 0) {
          // First word at center
          x = centerX;
          y = centerY;
        } else {
          // Spiral placement
          const angle = attempts * 0.3;
          const radius = attempts * 4 + 20;
          x = centerX + Math.cos(angle) * radius;
          y = centerY + Math.sin(angle) * radius * 0.6; // Flatten the spiral vertically
        }

        // Check bounds
        if (
          x - textWidth / 2 > 10 &&
          x + textWidth / 2 < rect.width - 10 &&
          y - textHeight / 2 > 10 &&
          y + textHeight / 2 < 390
        ) {
          if (
            !checkCollision(
              x - textWidth / 2,
              y - textHeight / 2,
              textWidth,
              textHeight,
            )
          ) {
            placed = true;
            placedWords.push({
              x: x - textWidth / 2,
              y: y - textHeight / 2,
              width: textWidth,
              height: textHeight,
            });
          }
        }
        attempts++;
      }

      // Draw the word
      ctx.fillText(keyword.word, x, y);

      // Add subtle shadow for better readability
      ctx.shadowColor = "rgba(0,0,0,0.1)";
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillText(keyword.word, x, y);

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5546e1] mx-auto mb-4"></div>
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
        <div className="bg-[#f9f9f9] border rounded-lg p-4">
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: "300px" }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
