import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface EnhancedMessageProps {
  content: string;
  role: "user" | "assistant";
  className?: string;
  isStreaming?: boolean;
  timestamp?: Date;
  showTypingIndicator?: boolean;
}

// Typing Indicator Component
const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-2">
    <span
      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
      style={{ animationDelay: "0ms" }}
    />
    <span
      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
      style={{ animationDelay: "150ms" }}
    />
    <span
      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
      style={{ animationDelay: "300ms" }}
    />
  </div>
);

export function EnhancedMessage({
  content,
  role,
  className,
  isStreaming = false,
  timestamp,
  showTypingIndicator = false,
}: EnhancedMessageProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Entrance animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const formatContent = (text: string) => {
    // Split content into sections based on headers (###, ##)
    const sections = text.split(/(?=###\s|##\s)/);

    return sections.map((section, index) => {
      // Handle H3 headers with gradient and emojis - FIXED GRADIENT
      if (section.startsWith("### ")) {
        const headerText = section.substring(4).split("\n")[0];
        const rest = section.substring(4 + headerText.length + 1);
        return (
          <div
            key={index}
            className="mb-4 transition-all duration-300 hover:translate-x-1"
          >
            <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 flex items-center gap-2">
              <span className="text-xl animate-pulse">📌</span>
              {headerText}
            </h3>
            {formatParagraphs(rest)}
          </div>
        );
      } else if (section.startsWith("## ")) {
        // Handle H2 headers with gradient and emojis - FIXED GRADIENT
        const headerText = section.substring(3).split("\n")[0];
        const rest = section.substring(3 + headerText.length + 1);
        return (
          <div
            key={index}
            className="mb-6 transition-all duration-300 hover:translate-x-1"
          >
            <h2 className="relative text-xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent mb-4 flex items-center gap-3">
              <span className="text-2xl animate-bounce">🎯</span>
              {headerText}
            </h2>
            {formatParagraphs(rest)}
          </div>
        );
      }

      return <div key={index}>{formatParagraphs(section)}</div>;
    });
  };

  const formatParagraphs = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim());

    return lines.map((line, index) => {
      // Handle bullet points with enhanced hover effects - FIXED STYLING
      if (line.trim().startsWith("- **") && line.includes(":**")) {
        const match = line.match(/- \*\*(.+?):\*\*(.+)/);
        if (match) {
          return (
            <div
              key={index}
              className="flex items-start gap-3 mb-3 p-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group"
            >
              <span className="text-blue-500 mt-0.5 group-hover:scale-125 transition-transform">
                •
              </span>
              <div className="flex-1">
                <span className="font-semibold text-gray-800">{match[1]}:</span>
                <span className="text-gray-700">
                  {formatInlineText(match[2])}
                </span>
              </div>
            </div>
          );
        }
      }

      // Handle numbered lists with gradient badges - FIXED STYLING
      const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
      if (numberedMatch) {
        return (
          <div
            key={index}
            className="flex items-start gap-3 mb-3 group hover:translate-x-1 transition-transform"
          >
            <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg group-hover:shadow-xl transition-shadow">
              {numberedMatch[1]}
            </span>
            <span className="text-gray-700 pt-0.5 flex-1">
              {formatInlineText(numberedMatch[2])}
            </span>
          </div>
        );
      }

      // Handle insights/data blocks with glassmorphism effect
      if (line.includes("**Insights:**") || line.includes("**Data Source:**")) {
        return (
          <div key={index} className="relative my-3 overflow-hidden rounded-lg">
            {/* Glassmorphism layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-purple-100/50 backdrop-blur-sm" />
            <div className="relative border-l-4 border-blue-500 pl-4 py-3 pr-4 bg-white/30 backdrop-blur-sm shadow-lg">
              <span
                dangerouslySetInnerHTML={{
                  __html: formatInlineText(line),
                }}
              />
            </div>
          </div>
        );
      }

      // Handle code blocks
      if (line.trim().startsWith("```")) {
        return (
          <pre
            key={index}
            className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-2"
          >
            <code>{line.replace(/```/g, "")}</code>
          </pre>
        );
      }

      return (
        <p
          key={index}
          className="mb-3 text-gray-700 leading-relaxed hover:text-gray-900 transition-colors"
        >
          <span
            dangerouslySetInnerHTML={{
              __html: formatInlineText(line),
            }}
          />
        </p>
      );
    });
  };

  const formatInlineText = (text: string) => {
    // CRITICAL BUG FIX: Use placeholder approach for percentages
    // Step 1: Extract and replace percentages with placeholders
    const percentageRegex = /(\d+(?:\.\d+)?%)/g;
    const percentages: string[] = [];
    let processedText = text.replace(percentageRegex, (match) => {
      const index = percentages.length;
      percentages.push(match);
      return `__PERCENTAGE_${index}__`;
    });

    // Step 2: Apply bold formatting with hover effects - ENHANCED
    processedText = processedText.replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-default">$1</strong>',
    );

    // Step 3: Apply italic formatting
    processedText = processedText.replace(
      /\*(.+?)\*/g,
      '<em class="italic">$1</em>',
    );

    // Step 4: Add emoji indicators for keywords
    processedText = processedText.replace(
      /\b(important|critical|urgent)\b/gi,
      "⚠️ $1",
    );
    processedText = processedText.replace(
      /\b(success|positive|good)\b/gi,
      "✅ $1",
    );
    processedText = processedText.replace(
      /\b(tip|recommendation|suggest)\b/gi,
      "💡 $1",
    );

    // Step 5: Highlight standalone numbers (not in percentages)
    processedText = processedText.replace(
      /\b(\d+(?:\.\d+)?)\b(?!%|__)/g,
      '<span class="text-blue-600 font-semibold">$1</span>',
    );

    // Step 6: Replace percentage placeholders with simple styling
    percentages.forEach((percentage, index) => {
      processedText = processedText.replace(
        `__PERCENTAGE_${index}__`,
        percentage,
      );
    });

    return processedText;
  };

  // Show typing indicator if requested
  if (showTypingIndicator && role === "assistant") {
    return <TypingIndicator />;
  }

  // User message styling with enhanced gradient background
  if (role === "user") {
    return (
      <div
        className={cn(
          "transition-all duration-500",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
          className,
        )}
      >
        <div className="flex justify-end mb-4">
          <div className="max-w-[80%] bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-4 rounded-2xl rounded-tr-sm shadow-xl border border-blue-400/20 transition-all duration-300 relative overflow-hidden">
            <div className="text-white font-medium leading-relaxed">
              {content}
            </div>
            {timestamp && (
              <div className="text-xs text-blue-100 mt-2 opacity-80">
                {timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Assistant message styling with ENHANCED CHAT BUBBLE DESIGN
  return (
    <div
      className={cn(
        "transition-all duration-500",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className,
      )}
    >
      <div className="flex justify-start mb-4">
        <div className="bg-white rounded-2xl rounded-tl-sm shadow-xl border border-gray-100 px-6 py-4 max-w-[85%] relative overflow-hidden">
          {/* Message content */}
          <div className="prose prose-sm max-w-none">
            {formatContent(content)}
          </div>

          {timestamp && (
            <div className="text-xs text-gray-400 mt-2">
              {timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
          {isStreaming && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-gray-500">Generating</span>
              <span
                className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Add to tailwind.config.js:
// animation: {
//   'bounce-slow': 'bounce-slow 2s ease-in-out infinite',
//   'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
//   'fadeIn': 'fadeIn 0.5s ease-out forwards',
// }
// keyframes: {
//   'bounce-slow': {
//     '0%, 100%': { transform: 'translateY(0)' },
//     '50%': { transform: 'translateY(-10px)' },
//   },
//   'pulse-slow': {
//     '0%, 100%': { opacity: '1' },
//     '50%': { opacity: '0.7' },
//   },
//   'fadeIn': {
//     'from': { opacity: '0', transform: 'translateY(10px)' },
//     'to': { opacity: '1', transform: 'translateY(0)' },
//   },
// }
