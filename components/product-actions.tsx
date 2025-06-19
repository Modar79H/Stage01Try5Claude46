// components/product-actions.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteProductDialog } from "@/components/delete-product-dialog";
import {
  MoreVertical,
  RefreshCw,
  Trash2,
  Download,
  Settings,
  AlertTriangle,
} from "lucide-react";

interface ProductActionsProps {
  product: {
    id: string;
    name: string;
    brand: {
      id: string;
      name: string;
    };
    reviewsCount: number;
    analyses: Array<{
      id: string;
      type: string;
      status: string;
    }>;
    competitors: Array<{
      id: string;
      name: string;
    }>;
  };
}

export function ProductActions({ product }: ProductActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const completedAnalyses = product.analyses.filter(
    (a) => a.status === "completed",
  );
  const hasCompletedAnalyses = completedAnalyses.length > 0;
  const hasData = product.reviewsCount > 0 || completedAnalyses.length > 0;

  const handleReprocessAnalysis = async () => {
    try {
      const response = await fetch(
        `/api/products/${product.id}/analysis/restart`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        console.error("Failed to restart analysis");
        alert("Failed to restart analysis. Please try again.");
      }
    } catch (error) {
      console.error("Error restarting analysis:", error);
      alert("An error occurred while restarting analysis.");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Product actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleReprocessAnalysis}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reprocess Analysis
          </DropdownMenuItem>

          {hasCompletedAnalyses && (
            <DropdownMenuItem
              onClick={() =>
                window.open(`/products/${product.id}/export`, "_blank")
              }
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF Report
            </DropdownMenuItem>
          )}

          <DropdownMenuItem>
            <Settings className="h-4 w-4 mr-2" />
            Product Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Product
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Standalone Delete Button for High Visibility */}
      {hasData && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Delete
        </Button>
      )}

      <DeleteProductDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        product={product}
      />
    </>
  );
}
