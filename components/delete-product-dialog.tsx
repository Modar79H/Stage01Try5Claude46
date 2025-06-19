// components/delete-product-dialog.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  Download,
  Trash2,
  Database,
  BarChart3,
  Users,
  FileText,
} from "lucide-react";

interface DeleteProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    brand: { name: string; id?: string };
    reviewsCount: number;
    analyses: Array<{ id: string; type: string; status: string }>;
    competitors: Array<{ id: string; name: string }>;
  };
  redirectPath?: string; // Optional custom redirect path
}

export function DeleteProductDialog({
  open,
  onOpenChange,
  product,
  redirectPath,
}: DeleteProductDialogProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExportReminder, setShowExportReminder] = useState(true);
  const router = useRouter();

  const expectedText = `delete ${product.name}`;
  const isConfirmationValid =
    confirmationText.toLowerCase() === expectedText.toLowerCase();

  const completedAnalyses = product.analyses.filter(
    (a) => a.status === "completed",
  );
  const hasData = product.reviewsCount > 0 || completedAnalyses.length > 0;

  const handleDelete = async () => {
    if (!isConfirmationValid) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Product deleted successfully:", result);

        // Handle navigation
        if (redirectPath) {
          // Use custom redirect path and refresh
          router.refresh();
        } else if (product.brand.id) {
          // Redirect to brand page if brandId is available
          router.push(`/brands/${product.brand.id}`);
          router.refresh();
        } else {
          // Fallback: just refresh current page
          router.refresh();
        }

        // Close dialog
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        console.error("Failed to delete product:", errorData);
        alert(`Failed to delete product: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("An error occurred while deleting the product");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportPDF = () => {
    // Open export page in new tab
    window.open(`/products/${product.id}/export`, "_blank");
  };

  const resetDialog = () => {
    setConfirmationText("");
    setShowExportReminder(true);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetDialog();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <DialogTitle className="text-red-900">Delete Product</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-3">
            <p className="font-medium">
              You are about to permanently delete "{product.name}" and all
              associated data.
            </p>

            {/* Data Summary */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900 mb-2">
                This will delete:
              </h4>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span>{product.reviewsCount.toLocaleString()} reviews</span>
                </div>

                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  <span>{completedAnalyses.length} analyses</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span>{product.competitors.length} competitors</span>
                </div>

                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-orange-600" />
                  <span>All processed data</span>
                </div>
              </div>
            </div>

            {/* Export Reminder */}
            {hasData && showExportReminder && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Download className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-900 mb-1">
                      Export your data first?
                    </h4>
                    <p className="text-yellow-800 text-sm mb-3">
                      Consider exporting your analysis results before deletion.
                      This action cannot be undone.
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleExportPDF}
                        className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowExportReminder(false)}
                        className="text-yellow-700 hover:bg-yellow-100"
                      >
                        Skip Export
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-red-600 font-medium">
              ⚠️ This action is permanent and cannot be undone.
            </p>
          </DialogDescription>
        </DialogHeader>

        {(!hasData || !showExportReminder) && (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="confirmation" className="text-sm font-medium">
                  Type{" "}
                  <span className="font-mono bg-gray-100 px-1 rounded">
                    delete {product.name}
                  </span>{" "}
                  to confirm:
                </Label>
                <Input
                  id="confirmation"
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={`delete ${product.name}`}
                  className="mt-1"
                  autoComplete="off"
                />
              </div>
            </div>

            <DialogFooter className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!isConfirmationValid || isDeleting}
                className="min-w-[120px]"
              >
                {isDeleting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Forever</span>
                  </div>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
