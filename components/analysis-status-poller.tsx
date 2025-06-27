"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AnalysisStatusPollerProps {
  productId: string;
  isProcessing: boolean;
  onStatusUpdate?: (data: any) => void;
}

export function AnalysisStatusPoller({ 
  productId, 
  isProcessing: initialProcessing,
  onStatusUpdate 
}: AnalysisStatusPollerProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(initialProcessing);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/products/${productId}/analysis/status`);
      if (response.ok) {
        const data = await response.json();
        
        // Call the callback if provided
        if (onStatusUpdate) {
          onStatusUpdate(data);
        }

        // Check if all analyses are completed
        const allCompleted = data.analyses.every(
          (analysis: any) => analysis.status === "completed" || analysis.status === "failed"
        );

        // If all analyses are completed and we were processing, refresh the page
        if (allCompleted && isProcessing) {
          setIsProcessing(false);
          // Clear the interval
          if (pollInterval) {
            clearInterval(pollInterval);
            setPollInterval(null);
          }
          // Refresh the page to show updated data
          router.refresh();
        }

        // Update processing state based on product status
        if (data.product?.isProcessing !== undefined) {
          setIsProcessing(data.product.isProcessing);
        }
      }
    } catch (error) {
      console.error("Error checking analysis status:", error);
    }
  }, [productId, isProcessing, router, pollInterval, onStatusUpdate]);

  useEffect(() => {
    // Only poll if processing
    if (isProcessing) {
      // Initial check
      checkStatus();

      // Set up polling interval (every 5 seconds)
      const interval = setInterval(checkStatus, 5000);
      setPollInterval(interval);

      return () => {
        clearInterval(interval);
      };
    }
  }, [isProcessing, productId]);

  // Update processing state when prop changes
  useEffect(() => {
    setIsProcessing(initialProcessing);
  }, [initialProcessing]);

  // This component doesn't render anything visible
  return null;
}