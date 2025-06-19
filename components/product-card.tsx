// components/product-card.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteProductDialog } from "@/components/delete-product-dialog";
import { formatDate } from "@/lib/utils";
import {
  Package,
  MoreVertical,
  BarChart3,
  FileText,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  Users,
} from "lucide-react";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    reviewsFile: string;
    reviewsCount: number;
    createdAt: Date;
    isProcessing: boolean;
    competitors: Array<{
      id: string;
      name: string;
    }>;
    analyses: Array<{
      id: string;
      type: string;
      status: string;
    }>;
    _count: {
      analyses: number;
    };
  };
  brandName: string;
}

export function ProductCard({ product, brandName }: ProductCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const completedAnalyses = product.analyses.filter(
    (a) => a.status === "completed",
  ).length;
  const totalExpectedAnalyses = product.competitors.length > 0 ? 11 : 10; // With or without competition analysis
  const completionPercentage = Math.round(
    (completedAnalyses / totalExpectedAnalyses) * 100,
  );

  const getStatusColor = () => {
    if (product.isProcessing) return "text-blue-600";
    if (completionPercentage === 100) return "text-green-600";
    if (completionPercentage > 0) return "text-yellow-600";
    return "text-gray-600";
  };

  const getStatusText = () => {
    if (product.isProcessing) return "Processing...";
    if (completionPercentage === 100) return "Complete";
    if (completionPercentage > 0) return "Partial";
    return "Pending";
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg truncate">
                  {product.name}
                </CardTitle>
                <CardDescription>{brandName}</CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/products/${product.id}`}
                    className="flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Analysis
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/products/${product.id}/competitors`}
                    className="flex items-center"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Competitors
                  </Link>
                </DropdownMenuItem>
                {completionPercentage > 0 && (
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/products/${product.id}/export`}
                      className="flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link
                    href={`/products/${product.id}/reprocess`}
                    className="flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reprocess
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Product
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <div className="flex items-center space-x-2">
              {product.isProcessing && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              )}
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Analysis Progress</span>
              <span className="text-gray-900">
                {completedAnalyses}/{totalExpectedAnalyses}
              </span>
            </div>
            <Progress value={completionPercentage} className="w-full" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Reviews</span>
              <div className="font-medium">
                {product.reviewsCount.toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Competitors</span>
              <div className="font-medium">{product.competitors.length}</div>
            </div>
          </div>

          {/* File info */}
          <div className="text-xs text-gray-500">
            <FileText className="h-3 w-3 inline mr-1" />
            {product.reviewsFile}
          </div>

          {/* Created date */}
          <div className="text-xs text-gray-500">
            Created {formatDate(product.createdAt)}
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button asChild size="sm" className="flex-1">
              <Link href={`/products/${product.id}`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analysis
              </Link>
            </Button>
            {completionPercentage > 0 && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/products/${product.id}/export`}>
                  <Download className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <DeleteProductDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        product={{
          id: product.id,
          name: product.name,
          brand: { name: brandName },
          reviewsCount: product.reviewsCount,
          analyses: product.analyses,
          competitors: product.competitors,
        }}
        redirectPath="stay" // Stay on current page (brand page)
      />
    </>
  );
}
