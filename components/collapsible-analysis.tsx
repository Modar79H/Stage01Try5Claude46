"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CollapsibleAnalysisProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleAnalysis({
  title,
  children,
  defaultOpen = false,
}: CollapsibleAnalysisProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="mb-4">
      <Button
        variant="ghost"
        className="w-full justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xl font-semibold text-[#104862] dark:text-white">
          {title}
        </h2>
        {isOpen ? (
          <ChevronUp className="h-6 w-6 text-[#E97132]" />
        ) : (
          <ChevronDown className="h-6 w-6 text-[#E97132]" />
        )}
      </Button>
      {isOpen && <div className="px-6 pb-6">{children}</div>}
    </Card>
  );
}
