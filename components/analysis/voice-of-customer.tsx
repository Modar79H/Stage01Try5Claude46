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

    const keywords = analysis.data?.voice_of_customer?.keywords;
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

    // Sort keywords by frequency and take top words based on available space
    const sortedKeywords = keywords.sort((a, b) => b.frequency - a.frequency);

    // Dynamic font sizing based on word count and frequency
    const getFontSize = (frequency: number, wordCount: number) => {
      const ratio = frequency / maxFreq;

      // Base size scales inversely with word count for better space utilization
      let maxSize: number;
      let minSize: number;

      if (wordCount <= 5) {
        // Very few words: make them much bigger
        maxSize = 120;
        minSize = 60;
      } else if (wordCount <= 10) {
        // Few words: still quite large
        maxSize = 100;
        minSize = 40;
      } else if (wordCount <= 20) {
        // Medium count: balanced sizes
        maxSize = 80;
        minSize = 28;
      } else if (wordCount <= 30) {
        // Many words: smaller range
        maxSize = 70;
        minSize = 22;
      } else {
        // Lots of words: compact sizing
        maxSize = 60;
        minSize = 18;
      }

      // Use power scaling for better differentiation
      const scaledRatio = Math.pow(ratio, 0.7);
      return Math.max(
        minSize,
        Math.min(maxSize, scaledRatio * (maxSize - minSize) + minSize),
      );
    };

    // Enhanced positioning with better space utilization
    const centerX = rect.width / 2;
    const centerY = 200;
    const placedWords: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      word: string;
    }> = [];

    // Adaptive spacing based on word count
    const getSpacing = (wordCount: number) => {
      if (wordCount <= 10) return 15; // More space for fewer words
      if (wordCount <= 20) return 8;
      if (wordCount <= 30) return 5;
      return 3; // Tighter packing for many words
    };

    const spacing = getSpacing(sortedKeywords.length);

    const checkCollision = (
      x: number,
      y: number,
      width: number,
      height: number,
    ) => {
      return placedWords.some(
        (placed) =>
          x < placed.x + placed.width + spacing &&
          x + width + spacing > placed.x &&
          y < placed.y + placed.height + spacing &&
          y + height + spacing > placed.y,
      );
    };

    // Use all available keywords for display
    const displayWordCount = sortedKeywords.length;
    const wordsToDisplay = sortedKeywords;

    // Multi-pass placement strategy for better coverage
    const placeWords = (words: typeof sortedKeywords, pass: number) => {
      words.forEach((keyword, index) => {
        const fontSize = getFontSize(keyword.frequency, displayWordCount);
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

        // Enhanced placement strategies
        while (!placed && attempts < 150) {
          if (attempts === 0 && index === 0) {
            // First word always at center
            x = centerX;
            y = centerY;
          } else if (attempts < 30) {
            // Try circular placement first for better distribution
            const angle = (attempts / 30) * Math.PI * 2 + index * 0.5;
            const radiusFactor = displayWordCount <= 10 ? 0.3 : 0.5;
            const radius =
              rect.width * radiusFactor * (0.3 + (attempts / 30) * 0.7);
            x = centerX + Math.cos(angle) * radius;
            y = centerY + Math.sin(angle) * radius * 0.7;
          } else if (attempts < 80) {
            // Then try spiral for filling gaps
            const spiralAttempt = attempts - 30;
            const angle = spiralAttempt * 0.2 + index * 0.3;
            const radius = spiralAttempt * 3 + 10;
            x = centerX + Math.cos(angle) * radius;
            y = centerY + Math.sin(angle) * radius * 0.6;
          } else {
            // Finally, try random placement for remaining words
            x = 50 + Math.random() * (rect.width - 100);
            y = 50 + Math.random() * 300;
          }

          // Check bounds with adaptive margins
          const margin = displayWordCount <= 10 ? 20 : 10;
          if (
            x - textWidth / 2 > margin &&
            x + textWidth / 2 < rect.width - margin &&
            y - textHeight / 2 > margin &&
            y + textHeight / 2 < 400 - margin
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
                word: keyword.word,
              });
            }
          }
          attempts++;
        }

        // Draw the word only if placed
        if (placed) {
          // Add subtle shadow for better readability
          ctx.shadowColor = "rgba(0,0,0,0.15)";
          ctx.shadowBlur = 3;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
          ctx.fillText(keyword.word, x, y);

          // Reset shadow
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
      });
    };

    // Place words
    placeWords(wordsToDisplay, 1);

    // If we have very few words and space is underutilized, try to add more variation
    if (displayWordCount <= 15 && placedWords.length < displayWordCount) {
      // Try placing any unplaced words with slightly different parameters
      const unplacedWords = wordsToDisplay.filter(
        (word) => !placedWords.some((placed) => placed.word === word.word),
      );
      if (unplacedWords.length > 0) {
        placeWords(unplacedWords, 2);
      }
    }
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

  const data = analysis.data?.voice_of_customer;

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

  const topKeywords = data.keywords.sort((a, b) => b.frequency - a.frequency);

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
