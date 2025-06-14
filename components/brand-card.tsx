// components/brand-card.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { formatDate } from "@/lib/utils";
import {
  Building2,
  MoreVertical,
  Package,
  BarChart3,
  Plus,
  Trash2,
  Eye,
} from "lucide-react";

interface BrandCardProps {
  brand: {
    id: string;
    name: string;
    createdAt: Date;
    products: Array<{
      id: string;
      name: string;
      reviewsCount: number;
      isProcessing: boolean;
      _count: {
        analyses: number;
      };
    }>;
  };
}

export function BrandCard({ brand }: BrandCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  const totalProducts = brand.products.length;
  const totalAnalyses = brand.products.reduce(
    (sum, product) => sum + product._count.analyses,
    0,
  );
  const processingProducts = brand.products.filter(
    (p) => p.isProcessing,
  ).length;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/brands/${brand.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        console.error("Failed to delete brand");
      }
    } catch (error) {
      console.error("Error deleting brand:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">{brand.name}</CardTitle>
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
                    href={`/brands/${brand.id}`}
                    className="flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/brands/${brand.id}/products/new`}
                    className="flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Brand
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardDescription>
            Created {formatDate(brand.createdAt)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Package className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-gray-900">
                {totalProducts}
              </div>
              <div className="text-xs text-gray-600">Products</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-gray-900">
                {totalAnalyses}
              </div>
              <div className="text-xs text-gray-600">Analyses</div>
            </div>
          </div>

          {/* Processing Status */}
          {processingProducts > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-800">
                  {processingProducts} product
                  {processingProducts > 1 ? "s" : ""} processing
                </span>
              </div>
            </div>
          )}

          {/* Recent Products */}
          {brand.products.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-2">
                Recent Products
              </h4>
              <div className="space-y-2">
                {brand.products.slice(0, 3).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600 truncate">
                      {product.name}
                    </span>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{product.reviewsCount} reviews</span>
                      {product.isProcessing && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>
                ))}
                {brand.products.length > 3 && (
                  <div className="text-xs text-gray-500 text-center pt-1">
                    +{brand.products.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/brands/${brand.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </Link>
            </Button>
            <Button asChild size="sm" className="flex-1">
              <Link href={`/brands/${brand.id}/products/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Brand"
        description={`Are you sure you want to delete "${brand.name}"? This will permanently delete the brand and all its products and analyses. This action cannot be undone.`}
      />
    </>
  );
}
