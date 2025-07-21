"use client";

import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

interface SuggestedPromptsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
}

export default function SuggestedPrompts({
  prompts,
  onSelect,
}: SuggestedPromptsProps) {
  if (!prompts || prompts.length === 0) return null;

  return (
    <div className="p-4 border-t">
      <div className="flex items-center space-x-2 mb-3 text-sm text-muted-foreground">
        <Lightbulb size={16} />
        <span>Suggested questions:</span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {prompts.map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelect(prompt)}
            className="text-left justify-start h-auto py-2 px-3 text-xs whitespace-normal"
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
}
