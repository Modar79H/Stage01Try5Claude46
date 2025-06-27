// app/not-found.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Home, ArrowLeft, Search, BarChart3 } from "lucide-react";

export default function NotFound() {
  const handleGoBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-[#5546e1]" />
            <span className="font-bold text-2xl text-gray-900">RevuIntel</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="text-6xl font-bold text-[#5546e1] mb-4">404</div>
            <CardTitle className="text-2xl">Page Not Found</CardTitle>
            <CardDescription>
              The page you're looking for doesn't exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Don't worry, let's get you back on track!
              </p>

              <div className="flex flex-col space-y-2">
                <Button asChild className="w-full">
                  <Link href="/dashboard">
                    <Home className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full">
                  <Link href="/brands">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Brands
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleGoBack}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Links */}
        <div className="mt-8 text-center">
          <div className="text-sm text-gray-600 mb-4">
            Need help? Try these popular pages:
          </div>
          <div className="flex justify-center space-x-4 text-sm">
            <Link href="/brands" className="text-blue-600 hover:underline">
              Brands
            </Link>
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Dashboard
            </Link>
            <Link href="/" className="text-blue-600 hover:underline">
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
