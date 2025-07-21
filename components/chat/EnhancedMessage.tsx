import React from "react";
import { cn } from "@/lib/utils";

interface EnhancedMessageProps {
  content: string;
  role: "user" | "assistant";
  className?: string;
}

export function EnhancedMessage({
  content,
  role,
  className,
}: EnhancedMessageProps) {
  const formatContent = (text: string) => {
    // Split content into sections based on headers (###, ##)
    const sections = text.split(/(?=###\s|##\s)/);

    return sections.map((section, index) => {
      // Handle headers with emojis
      if (section.startsWith("### ")) {
        const headerText = section.substring(4).split("\n")[0];
        const rest = section.substring(4 + headerText.length + 1);
        return (
          <div key={index} className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-xl">📌</span>
              {headerText}
            </h3>
            {formatParagraphs(rest)}
          </div>
        );
      } else if (section.startsWith("## ")) {
        const headerText = section.substring(3).split("\n")[0];
        const rest = section.substring(3 + headerText.length + 1);
        return (
          <div key={index} className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
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
      // Handle bullet points with icons
      if (line.trim().startsWith("- **") && line.includes(":**")) {
        const match = line.match(/- \*\*(.+?):\*\*(.+)/);
        if (match) {
          return (
            <div key={index} className="flex items-start gap-2 mb-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <div>
                <span className="font-semibold text-gray-800">{match[1]}:</span>
                <span className="text-gray-700">{match[2]}</span>
              </div>
            </div>
          );
        }
      }

      // Handle numbered lists with better styling
      const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
      if (numberedMatch) {
        return (
          <div key={index} className="flex items-start gap-3 mb-2">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              {numberedMatch[1]}
            </span>
            <span className="text-gray-700">
              {formatInlineText(numberedMatch[2])}
            </span>
          </div>
        );
      }

      // Handle insights/data blocks
      if (line.includes("**Insights:**") || line.includes("**Data Source:**")) {
        return (
          <div
            key={index}
            className="bg-gray-50 border-l-4 border-blue-500 pl-4 py-2 my-2"
          >
            {formatInlineText(line)}
          </div>
        );
      }

      // Handle percentage mentions with highlighting
      const percentageRegex = /(\d+%)/g;
      const lineWithHighlights = line.replace(
        percentageRegex,
        '<span class="bg-yellow-100 px-1 rounded font-semibold text-yellow-800">$1</span>',
      );

      return (
        <p key={index} className="mb-2 text-gray-700 leading-relaxed">
          <span
            dangerouslySetInnerHTML={{
              __html: formatInlineText(lineWithHighlights),
            }}
          />
        </p>
      );
    });
  };

  const formatInlineText = (text: string) => {
    // Convert **text** to bold
    text = text.replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-semibold text-gray-900">$1</strong>',
    );

    // Convert *text* to italic
    text = text.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

    // Add emoji indicators for certain keywords
    text = text.replace(/\b(important|critical|urgent)\b/gi, "⚠️ $1");
    text = text.replace(/\b(success|positive|good)\b/gi, "✅ $1");
    text = text.replace(/\b(tip|recommendation|suggest)\b/gi, "💡 $1");

    return text;
  };

  if (role === "user") {
    return <div className={cn("text-gray-700", className)}>{content}</div>;
  }

  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      {formatContent(content)}
    </div>
  );
}
