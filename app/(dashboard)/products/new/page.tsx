// app/(dashboard)/products/new/page.tsx
"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isValidCSV, formatFileSize } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  X,
  Package,
  Users,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { CSVConfirmationDialog } from "@/components/csv-confirmation-dialog";
import type {
  CSVValidationResult,
  UserConfirmedMapping,
} from "@/lib/types/csv-variations";

interface Brand {
  id: string;
  name: string;
}

interface CompetitorFile {
  id: string;
  name: string;
  file: File | null;
  validationResult?: CSVValidationResult;
  isValidating?: boolean;
  confirmedMapping?: UserConfirmedMapping;
}

export default function NewProductPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorFile[]>([]);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] =
    useState<CSVValidationResult | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmedMapping, setConfirmedMapping] =
    useState<UserConfirmedMapping | null>(null);
  const [pendingCompetitorId, setPendingCompetitorId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    async function fetchBrands() {
      try {
        const response = await fetch("/api/brands");
        if (response.ok) {
          const data = await response.json();
          setBrands(data.brands || []);
        }
      } catch (error) {
        console.error("Failed to fetch brands:", error);
      } finally {
        setLoadingBrands(false);
      }
    }

    if (session?.user) {
      fetchBrands();
    }
  }, [session]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    setError("");
    setValidationResult(null);

    if (!isValidCSV(uploadedFile.name)) {
      setError("Please upload a CSV file");
      return;
    }

    if (uploadedFile.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB");
      return;
    }

    setFile(uploadedFile);
    setIsValidating(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const response = await fetch("/api/validate-csv", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setValidationResult(result);

      if (!result.isValid) {
        // Show structural errors (file size, empty headers, etc.)
        setError(`CSV validation failed: ${result.errors.join(", ")}`);
      } else {
        // Always show confirmation dialog for structurally valid CSVs
        setShowConfirmDialog(true);
      }
    } catch (error) {
      setError("Failed to validate CSV file");
    } finally {
      setIsValidating(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const removeFile = () => {
    setFile(null);
    setValidationResult(null);
    setConfirmedMapping(null);
    setError("");
  };

  const handleConfirmMapping = (mapping: UserConfirmedMapping) => {
    if (pendingCompetitorId) {
      // Handle competitor confirmation
      setCompetitors((prev) =>
        prev.map((c) =>
          c.id === pendingCompetitorId
            ? { ...c, confirmedMapping: mapping }
            : c,
        ),
      );
      setPendingCompetitorId(null);
    } else {
      // Handle main product confirmation
      setConfirmedMapping(mapping);
    }
    setShowConfirmDialog(false);
  };

  const handleCancelConfirmation = () => {
    if (pendingCompetitorId) {
      // Reset competitor validation
      setCompetitors((prev) =>
        prev.map((c) =>
          c.id === pendingCompetitorId
            ? { ...c, file: null, validationResult: undefined }
            : c,
        ),
      );
      setPendingCompetitorId(null);
    } else {
      // Reset main file
      removeFile();
    }
    setShowConfirmDialog(false);
    setValidationResult(null);
  };

  // Competitor management functions
  const addCompetitor = () => {
    const newCompetitor: CompetitorFile = {
      id: Date.now().toString(),
      name: "",
      file: null,
    };
    setCompetitors([...competitors, newCompetitor]);
  };

  const removeCompetitor = (id: string) => {
    setCompetitors(competitors.filter((c) => c.id !== id));
  };

  const updateCompetitorName = (id: string, name: string) => {
    setCompetitors(competitors.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const updateCompetitorFile = async (id: string, file: File | null) => {
    if (!file) {
      setCompetitors((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, file: null, validationResult: undefined } : c,
        ),
      );
      return;
    }

    setCompetitors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, file, isValidating: true } : c)),
    );

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/validate-csv", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      setCompetitors((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, validationResult: result, isValidating: false }
            : c,
        ),
      );

      if (result.isValid) {
        // Always show confirmation dialog for structurally valid competitor CSVs
        setPendingCompetitorId(id);
        setValidationResult(result);
        setShowConfirmDialog(true);
      }
    } catch (error) {
      setCompetitors((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                validationResult: {
                  isValid: false,
                  errors: ["Failed to validate CSV file"],
                  preview: [],
                },
                isValidating: false,
              }
            : c,
        ),
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand || !name.trim() || !file) return;

    setLoading(true);
    setError("");
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("brandId", selectedBrand);
      formData.append("reviewsFile", file);

      // Add confirmed mapping if available
      if (confirmedMapping) {
        formData.append("mainProductMapping", JSON.stringify(confirmedMapping));
      }

      // Add competitors if any
      const validCompetitors = competitors.filter(
        (c) =>
          c.name &&
          c.file &&
          (c.validationResult?.isValid || c.confirmedMapping),
      );

      if (validCompetitors.length > 0) {
        formData.append("competitorCount", validCompetitors.length.toString());
        validCompetitors.forEach((competitor, index) => {
          formData.append(`competitorName_${index}`, competitor.name);
          formData.append(`competitorFile_${index}`, competitor.file!);
          if (competitor.confirmedMapping) {
            formData.append(
              `competitorMapping_${index}`,
              JSON.stringify(competitor.confirmedMapping),
            );
          }
        });
      }

      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "An error occurred");
        return;
      }

      router.push(`/products/${data.product.id}`);
      router.refresh();
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    if (
      !selectedBrand ||
      !name.trim() ||
      !file ||
      (validationResult && !validationResult.isValid)
    ) {
      return false;
    }

    // Check if main file needs confirmation (always required for valid CSVs)
    if (file && validationResult?.isValid && !confirmedMapping) {
      return false;
    }

    // Check competitors
    for (const competitor of competitors) {
      if (competitor.name || competitor.file) {
        if (!competitor.name || !competitor.file) {
          return false;
        }
        if (competitor.file && competitor.validationResult) {
          if (!competitor.validationResult.isValid) {
            return false;
          }
          if (
            competitor.validationResult.isValid &&
            !competitor.confirmedMapping
          ) {
            return false;
          }
        }
      }
    }

    return true;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Create New Product
          </h1>
          <p className="text-gray-600 mt-1">
            Add a new product to analyze customer reviews
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Product Information
            </CardTitle>
            <CardDescription>
              Fill in the details for your new product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingBrands
                        ? "Loading brands..."
                        : brands.length === 0
                          ? "No brands available"
                          : "Select a brand"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {brands && brands.length > 0
                    ? brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))
                    : null}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., iPhone 15 Pro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
              />
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Reviews CSV File
            </CardTitle>
            <CardDescription>
              Click to upload or drag and drop
              <br />
              CSV file with reviews
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!file ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-blue-600">Drop the CSV file here...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      CSV file with reviews
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {isValidating && (
                  <div className="mt-4 flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Validating CSV structure...</span>
                  </div>
                )}

                {validationResult && (
                  <div className="mt-4">
                    {validationResult.isValid ? (
                      <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-md">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">
                          CSV file is valid and ready for processing
                        </span>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="flex items-center space-x-2 text-red-600 mb-2">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            CSV Validation Errors:
                          </span>
                        </div>
                        <ul className="text-sm text-red-600 space-y-1 ml-6">
                          {validationResult.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                CSV Requirements:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  • Must contain a column with review text (e.g., "review",
                  "text", "comment")
                </li>
                <li>• Must contain a rating column (1-5 stars)</li>
                <li>• Optional: date column</li>
                <li>
                  • Optional: product variation columns (size, color, etc.)
                </li>
                <li>• Maximum file size: 50MB</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Competitors Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Competitor Products (Optional)
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCompetitor}
                disabled={competitors.length >= 5}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Competitor
              </Button>
            </CardTitle>
            <CardDescription>
              Add competitor products for comparison analysis. You can add up to
              5 competitors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {competitors.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  No competitors added. Competition analysis will be skipped.
                </p>
              </div>
            ) : (
              <>
                {competitors.map((competitor, index) => (
                  <CompetitorCard
                    key={competitor.id}
                    competitor={competitor}
                    index={index}
                    onUpdateName={updateCompetitorName}
                    onUpdateFile={updateCompetitorFile}
                    onRemove={removeCompetitor}
                  />
                ))}
                {competitors.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={addCompetitor}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Competitor
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Upload Progress */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">
                    Processing CSV files and starting analysis...
                  </span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading || !isFormValid()}>
            {loading ? "Creating Product..." : "Create Product"}
          </Button>
        </div>
      </form>

      {/* CSV Confirmation Dialog */}
      {showConfirmDialog && validationResult && (
        <CSVConfirmationDialog
          open={showConfirmDialog}
          onClose={handleCancelConfirmation}
          validationResult={validationResult}
          onConfirm={handleConfirmMapping}
        />
      )}
    </div>
  );
}

function CompetitorCard({
  competitor,
  index,
  onUpdateName,
  onUpdateFile,
  onRemove,
}: {
  competitor: CompetitorFile;
  index: number;
  onUpdateName: (id: string, name: string) => void;
  onUpdateFile: (id: string, file: File | null) => void;
  onRemove: (id: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) {
        return;
      }

      if (!isValidCSV(file.name)) {
        alert("Please upload a CSV file");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        alert("File size must be less than 50MB");
        return;
      }

      onUpdateFile(competitor.id, file);
    },
    [competitor.id, onUpdateFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onDrop([file]);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Competitor #{index + 1}</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(competitor.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Competitor Name *</Label>
          <Input
            type="text"
            placeholder="e.g., Samsung Galaxy S24"
            value={competitor.name}
            onChange={(e) => onUpdateName(competitor.id, e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Reviews CSV *</Label>
          {!competitor.file ? (
            <>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors bg-white ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                <input {...getInputProps()} />
                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Drop CSV or click</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={(e) => {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }}
              >
                Browse Files
              </Button>
            </>
          ) : (
            <div className="border rounded-lg p-2 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0">
                  <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      {competitor.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(competitor.file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdateFile(competitor.id, null)}
                  className="flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {competitor.isValidating && (
                <div className="mt-1 flex items-center space-x-1 text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  <span className="text-xs">Validating...</span>
                </div>
              )}

              {competitor.validationResult && (
                <div className="mt-1">
                  {competitor.validationResult.isValid ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span className="text-xs">Valid</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-xs">Invalid</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
