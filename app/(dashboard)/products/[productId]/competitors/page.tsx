// app/(dashboard)/products/[productId]/competitors/page.tsx
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
  Users,
  Plus,
  Trash2,
} from "lucide-react";

interface Props {
  params: { productId: string };
}

interface CompetitorFile {
  id: string;
  name: string;
  file: File;
  validationResult?: {
    isValid: boolean;
    errors: string[];
    preview: any[];
  };
  isValidating?: boolean;
}

export default function CompetitorsPage({ params }: Props) {
  const [competitors, setCompetitors] = useState<CompetitorFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const addCompetitor = () => {
    const newCompetitor: CompetitorFile = {
      id: Date.now().toString(),
      name: "",
      file: null as any,
    };
    setCompetitors([...competitors, newCompetitor]);
  };

  const removeCompetitor = (id: string) => {
    setCompetitors(competitors.filter((c) => c.id !== id));
  };

  const updateCompetitorName = (id: string, name: string) => {
    setCompetitors(competitors.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const updateCompetitorFile = async (id: string, file: File) => {
    setCompetitors(
      competitors.map((c) =>
        c.id === id ? { ...c, file, isValidating: true } : c,
      ),
    );

    // Validate CSV structure
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/validate-csv", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      setCompetitors(
        competitors.map((c) =>
          c.id === id
            ? { ...c, validationResult: result, isValidating: false }
            : c,
        ),
      );
    } catch (error) {
      setCompetitors(
        competitors.map((c) =>
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

    const validCompetitors = competitors.filter(
      (c) => c.name && c.file && c.validationResult?.isValid,
    );

    if (validCompetitors.length === 0) {
      setError("Please add at least one valid competitor");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // TODO: Implement API endpoint to add competitors
      // For now, just show success and redirect
      router.push(`/products/${params.productId}`);
      router.refresh();
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/products/${params.productId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Product
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Competitors</h1>
          <p className="text-gray-600 mt-1">
            Upload competitor reviews for comparison analysis
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Competitors List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Competitor Products
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
              Add up to 5 competitor products for comparison. Each competitor
              requires a name and CSV file with reviews.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {competitors.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No competitors added yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Click "Add Competitor" to get started
                </p>
              </div>
            ) : (
              competitors.map((competitor, index) => (
                <CompetitorCard
                  key={competitor.id}
                  competitor={competitor}
                  index={index}
                  onUpdateName={updateCompetitorName}
                  onUpdateFile={updateCompetitorFile}
                  onRemove={removeCompetitor}
                />
              ))
            )}

            {competitors.length > 0 && competitors.length < 5 && (
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
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" asChild>
            <Link href={`/products/${params.productId}`}>Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={
              isLoading ||
              competitors.length === 0 ||
              !competitors.every(
                (c) => c.name && c.file && c.validationResult?.isValid,
              )
            }
          >
            {isLoading ? "Adding Competitors..." : "Add Competitors & Analyze"}
          </Button>
        </div>
      </form>
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
  onUpdateFile: (id: string, file: File) => void;
  onRemove: (id: string) => void;
}) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (!isValidCSV(file.name)) {
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
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

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Competitor #{index + 1}</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(competitor.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Competitor Name *</Label>
        <Input
          type="text"
          placeholder="e.g., Samsung Galaxy S24, Adidas Ultraboost"
          value={competitor.name}
          onChange={(e) => onUpdateName(competitor.id, e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Reviews CSV *</Label>
        {!competitor.file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Drop CSV file or click to browse
            </p>
          </div>
        ) : (
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">{competitor.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(competitor.file.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onUpdateFile(competitor.id, null as any)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {competitor.isValidating && (
              <div className="mt-2 flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                <span className="text-xs">Validating...</span>
              </div>
            )}

            {competitor.validationResult && (
              <div className="mt-2">
                {competitor.validationResult.isValid ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span className="text-xs">Valid CSV</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span className="text-xs">Invalid CSV</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
