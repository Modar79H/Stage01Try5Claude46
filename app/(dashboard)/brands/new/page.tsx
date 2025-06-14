// app/(dashboard)/brands/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { AlertCircle, ArrowLeft, Building2 } from "lucide-react";

export default function NewBrandPage() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!name.trim()) {
      setError("Brand name is required");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "An error occurred");
        return;
      }

      router.push(`/brands/${data.brand.id}`);
      router.refresh();
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/brands">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Brands
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Brand</h1>
          <p className="text-gray-600 mt-1">
            Add a new brand to organize your products and analyses
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Brand Information
          </CardTitle>
          <CardDescription>
            Enter the details for your new brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Brand Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter brand name (e.g., Nike, Apple, Samsung)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
              />
              <p className="text-sm text-gray-500">
                Choose a descriptive name for your brand. You can organize
                multiple products under this brand.
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/brands">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isLoading || !name.trim()}>
                {isLoading ? "Creating..." : "Create Brand"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">What's Next?</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="space-y-3">
            <p>After creating your brand, you'll be able to:</p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Add products with customer review CSV files
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Get AI-powered analysis including sentiment, personas, and
                recommendations
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Compare your products with competitors
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Export comprehensive PDF reports
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
