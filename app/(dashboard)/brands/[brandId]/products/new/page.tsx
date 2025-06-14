// app/(dashboard)/brands/[brandId]/products/new/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { isValidCSV, formatFileSize } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  X,
  Package,
} from "lucide-react";

interface Props {
  params: { brandId: string };
}

export default function NewProductPage({ params }: Props) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    preview: any[];
  } | null>(null);
  const router = useRouter();

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
      // 50MB limit
      setError("File size must be less than 50MB");
      return;
    }

    setFile(uploadedFile);
    setIsValidating(true);

    // Validate CSV structure
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
        setError("CSV validation failed");
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
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim()) return;

    setIsLoading(true);
    setError("");
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("brandId", params.brandId);
      formData.append("reviewsFile", file);

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
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/brands/${params.brandId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Brand
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-1">
            Upload customer reviews to start AI analysis
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
              Enter basic information about your product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter product name (e.g., iPhone 15 Pro, Nike Air Max)"
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
              Customer Reviews CSV
            </CardTitle>
            <CardDescription>
              Upload a CSV file containing customer reviews for analysis
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
                      Drag and drop your CSV file here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Maximum file size: 50MB
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
                <li>• Optional: rating column (1-5 stars)</li>
                <li>• Optional: date column</li>
                <li>
                  • Optional: product variation columns (size, color, etc.)
                </li>
                <li>• Maximum file size: 50MB</li>
              </ul>
            </div>
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
        {isLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">
                    Processing CSV and starting analysis...
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
            <Link href={`/brands/${params.brandId}`}>Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={
              isLoading ||
              !name.trim() ||
              !file ||
              (validationResult && !validationResult.isValid)
            }
          >
            {isLoading
              ? "Creating Product..."
              : "Create Product & Start Analysis"}
          </Button>
        </div>
      </form>
    </div>
  );
}
