"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Edit2, Plus } from "lucide-react";
import type {
  CSVValidationResult,
  DetectedVariation,
  UserConfirmedMapping,
} from "@/lib/types/csv-variations";

interface CSVConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  validationResult: CSVValidationResult;
  onConfirm: (mapping: UserConfirmedMapping) => void;
}

export function CSVConfirmationDialog({
  open,
  onClose,
  validationResult,
  onConfirm,
}: CSVConfirmationDialogProps) {
  const { detectedColumns, detectedVariations, preview } = validationResult;

  // Get all available column names from preview
  const availableColumns = preview.length > 0 ? Object.keys(preview[0]) : [];

  const [mapping, setMapping] = useState<UserConfirmedMapping>({
    reviewText:
      detectedColumns.reviewText ||
      (availableColumns.length > 0 ? availableColumns[0] : ""),
    rating:
      detectedColumns.rating ||
      (availableColumns.length > 1 ? availableColumns[1] : ""),
    date:
      detectedColumns.date ||
      (availableColumns.length > 2 ? availableColumns[2] : ""),
    variationId: detectedColumns.variationId || undefined,
    variationName: detectedColumns.variationName || undefined,
  });

  const [editingVariations, setEditingVariations] = useState(false);
  const [variationDescriptions, setVariationDescriptions] = useState<
    Record<string, { name: string; description?: string }>
  >(() => {
    // Initialize with existing variation names
    const initial: Record<string, { name: string; description?: string }> = {};
    detectedVariations.forEach((variation) => {
      initial[variation.name] = {
        name: variation.name,
        description: "",
      };
    });
    return initial;
  });

  const handleColumnChange = (
    field: keyof UserConfirmedMapping,
    value: string,
  ) => {
    setMapping((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  const handleVariationEdit = (
    originalKey: string,
    field: "name" | "description",
    value: string,
  ) => {
    setVariationDescriptions((prev) => ({
      ...prev,
      [originalKey]: {
        ...prev[originalKey],
        [field]: value,
      },
    }));
  };

  const handleConfirm = () => {
    // Filter out variations with no meaningful changes
    const processedVariations: Record<
      string,
      { name: string; description?: string }
    > = {};

    Object.entries(variationDescriptions).forEach(([originalKey, data]) => {
      const hasNameChange = data.name && data.name.trim() !== originalKey;
      const hasDescription = data.description && data.description.trim() !== "";

      if (hasNameChange || hasDescription) {
        processedVariations[originalKey] = {
          name: data.name?.trim() || originalKey,
          description: data.description?.trim() || undefined,
        };
      }
    });

    const finalMapping: UserConfirmedMapping = {
      ...mapping,
      variations:
        Object.keys(processedVariations).length > 0
          ? processedVariations
          : undefined,
    };

    onConfirm(finalMapping);
  };

  const isValid = mapping.reviewText && mapping.rating && mapping.date;

  // Helper function to check if a variation has been edited
  const isVariationEdited = (originalName: string) => {
    const edited = variationDescriptions[originalName];
    if (!edited) return false;

    const hasNameChange = edited.name && edited.name.trim() !== originalName;
    const hasDescription =
      edited.description && edited.description.trim() !== "";

    return hasNameChange || hasDescription;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm CSV Column Mapping</DialogTitle>
          <DialogDescription>
            Please confirm or adjust the detected columns and variations from
            your CSV file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Column Mapping Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Column Mapping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Review Text Column */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">
                  Review Text <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={mapping.reviewText}
                  onValueChange={(value) =>
                    handleColumnChange("reviewText", value)
                  }
                >
                  <SelectTrigger className="col-span-2">
                    <SelectValue placeholder="Select review text column" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rating Column */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">
                  Rating <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={mapping.rating}
                  onValueChange={(value) => handleColumnChange("rating", value)}
                >
                  <SelectTrigger className="col-span-2">
                    <SelectValue placeholder="Select rating column" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Column */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={mapping.date}
                  onValueChange={(value) => handleColumnChange("date", value)}
                >
                  <SelectTrigger className="col-span-2">
                    <SelectValue placeholder="Select date column" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Variation ID Column (Optional) */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">Variation ID</Label>
                <Select
                  value={mapping.variationId || "none"}
                  onValueChange={(value) =>
                    handleColumnChange(
                      "variationId",
                      value === "none" ? "" : value,
                    )
                  }
                >
                  <SelectTrigger className="col-span-2">
                    <SelectValue placeholder="Select variation ID column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="none"
                      className="bg-white hover:bg-gray-100"
                    >
                      None
                    </SelectItem>
                    {availableColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Variation Name Column (Optional) */}
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right">Variation Name</Label>
                <Select
                  value={mapping.variationName || "none"}
                  onValueChange={(value) =>
                    handleColumnChange(
                      "variationName",
                      value === "none" ? "" : value,
                    )
                  }
                >
                  <SelectTrigger className="col-span-2">
                    <SelectValue placeholder="Select variation name column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="none"
                      className="bg-white hover:bg-gray-100"
                    >
                      None
                    </SelectItem>
                    {availableColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Detected Variations Section */}
          {detectedVariations.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  Detected Variations ({detectedVariations.length})
                  {editingVariations && (
                    <Badge variant="outline" className="text-xs">
                      Editing Mode
                    </Badge>
                  )}
                </CardTitle>
                <Button
                  variant={editingVariations ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditingVariations(!editingVariations)}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  {editingVariations ? "Save Changes" : "Edit Descriptions"}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {detectedVariations.map((variation) => (
                    <div
                      key={variation.name}
                      className={`p-4 border rounded-lg transition-all ${
                        editingVariations ? "bg-slate-50" : ""
                      }`}
                    >
                      {!editingVariations ? (
                        // Display mode
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {variationDescriptions[variation.name]
                                    ?.name || variation.name}
                                </span>
                                <Badge
                                  variant={
                                    variation.type === "semantic"
                                      ? "default"
                                      : variation.type === "non-semantic"
                                        ? "secondary"
                                        : "outline"
                                  }
                                >
                                  {variation.type}
                                </Badge>
                                {isVariationEdited(variation.name) && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-green-50 text-green-700 border-green-200"
                                  >
                                    Modified
                                  </Badge>
                                )}
                              </div>
                              {variationDescriptions[variation.name]
                                ?.description && (
                                <div className="mt-1 text-sm text-gray-600 italic">
                                  "
                                  {
                                    variationDescriptions[variation.name]
                                      .description
                                  }
                                  "
                                </div>
                              )}
                              {variation.attributes && (
                                <div className="flex gap-2 mt-1">
                                  {Object.entries(variation.attributes).map(
                                    ([key, value]) => (
                                      <Badge
                                        key={key}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {key}: {value}
                                      </Badge>
                                    ),
                                  )}
                                </div>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {variation.reviewCount} reviews
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Edit mode
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <Label className="text-sm font-medium text-gray-700">
                                Variation Name
                              </Label>
                              <Input
                                value={
                                  variationDescriptions[variation.name]?.name ||
                                  variation.name
                                }
                                onChange={(e) =>
                                  handleVariationEdit(
                                    variation.name,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                className="mt-1"
                                placeholder="Enter variation name"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                              <Badge
                                variant={
                                  variation.type === "semantic"
                                    ? "default"
                                    : variation.type === "non-semantic"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {variation.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {variation.reviewCount} reviews
                              </span>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Description
                              <span className="text-xs text-muted-foreground ml-1">
                                (helps AI understand this variation better)
                              </span>
                            </Label>
                            <Input
                              value={
                                variationDescriptions[variation.name]
                                  ?.description || ""
                              }
                              onChange={(e) =>
                                handleVariationEdit(
                                  variation.name,
                                  "description",
                                  e.target.value,
                                )
                              }
                              className="mt-1"
                              placeholder="Describe what makes this variation unique..."
                            />
                          </div>

                          {variation.attributes && (
                            <div className="flex gap-2 flex-wrap">
                              <span className="text-xs text-muted-foreground">
                                Detected attributes:
                              </span>
                              {Object.entries(variation.attributes).map(
                                ([key, value]) => (
                                  <Badge
                                    key={key}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {key}: {value}
                                  </Badge>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {detectedVariations.some((v) => v.type === "non-semantic")
                      ? "Some variations couldn't be automatically understood. Use 'Edit Descriptions' to provide clearer names and descriptions for better analysis quality."
                      : "Click 'Edit Descriptions' to customize variation names and add descriptions that will help improve the AI analysis quality."}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {availableColumns.slice(0, 5).map((col) => (
                        <th key={col} className="text-left p-2 font-medium">
                          {col}
                          {col === mapping.reviewText && (
                            <Badge className="ml-2" variant="default">
                              Review
                            </Badge>
                          )}
                          {col === mapping.rating && (
                            <Badge className="ml-2" variant="default">
                              Rating
                            </Badge>
                          )}
                          {col === mapping.date && (
                            <Badge className="ml-2" variant="default">
                              Date
                            </Badge>
                          )}
                          {col === mapping.variationId && (
                            <Badge className="ml-2" variant="secondary">
                              Var ID
                            </Badge>
                          )}
                          {col === mapping.variationName && (
                            <Badge className="ml-2" variant="secondary">
                              Var Name
                            </Badge>
                          )}
                        </th>
                      ))}
                      {availableColumns.length > 5 && (
                        <th className="text-left p-2 text-muted-foreground">
                          ...
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 3).map((row, idx) => (
                      <tr key={idx} className="border-b">
                        {availableColumns.slice(0, 5).map((col) => (
                          <td key={col} className="p-2 truncate max-w-xs">
                            {row[col]}
                          </td>
                        ))}
                        {availableColumns.length > 5 && (
                          <td className="p-2 text-muted-foreground">...</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirm and Process
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
