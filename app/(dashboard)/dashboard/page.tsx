// app/(dashboard)/dashboard/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Building2,
  Package,
  TrendingUp,
  Users,
  FileText,
  Plus,
  Activity,
  Sparkles,
  ArrowRight,
  Clock,
} from "lucide-react";

async function getDashboardData(userId: string) {
  const [brands, totalProducts, totalAnalyses, recentProducts] =
    await Promise.all([
      prisma.brand.count({
        where: { userId },
      }),
      prisma.product.count({
        where: {
          brand: { userId },
        },
      }),
      prisma.analysis.count({
        where: {
          product: { brand: { userId } },
          status: "completed",
        },
      }),
      prisma.product.findMany({
        where: {
          brand: { userId },
        },
        include: {
          brand: true,
          analyses: {
            select: {
              type: true,
              status: true,
            },
          },
          competitors: true,
          _count: {
            select: { analyses: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  return { brands, totalProducts, totalAnalyses, recentProducts };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const { brands, totalProducts, totalAnalyses, recentProducts } =
    await getDashboardData(session.user.id);

  return (
    <div className="container-max">
      <div className="space-y-8">
        {/* Header */}
        <div className="pt-8">
          <h1 className="text-3xl font-semibold text-foreground">
            Welcome back!
          </h1>
          <p className="text-muted-foreground mt-1">
            {session.user.name || session.user.email} • Here's your business
            overview
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Brands
              </CardTitle>
              <div className="p-2 bg-secondary rounded-md">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{brands}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active brands
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Products
              </CardTitle>
              <div className="p-2 bg-secondary rounded-md">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Products analyzed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                AI Analyses
              </CardTitle>
              <div className="p-2 bg-secondary rounded-md">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{totalAnalyses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Insights generated
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Products - 2 columns */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Products</CardTitle>
                {recentProducts.length > 0 && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/brands">
                      View all
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
              <CardDescription>Your latest product analyses</CardDescription>
            </CardHeader>
            <CardContent>
              {recentProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-foreground mb-1 font-medium">
                    No products yet
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by creating a brand and adding products
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/brands">
                      <Plus className="h-4 w-4 mr-2" />
                      Get Started
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">
                                {product.name}
                              </h4>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <span>{product.brand.name}</span>
                                <span>•</span>
                                <span>{product.reviewsCount} reviews</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="info" size="sm">
                            {(() => {
                              // VOC sub-analyses that should be counted as one
                              const vocSubAnalyses = [
                                "voice_of_customer",
                                "sentiment",
                                "rating_analysis",
                                "four_w_matrix",
                              ];

                              // Internal analysis types that should not be counted in UI
                              const internalAnalyses = [
                                "personas",
                                "competition",
                              ];

                              // Filter out internal analysis types
                              const visibleAnalyses = product.analyses.filter(
                                (a) => !internalAnalyses.includes(a.type),
                              );

                              // Count analyses, treating VOC group as one
                              const vocCount = visibleAnalyses.some(
                                (a) =>
                                  vocSubAnalyses.includes(a.type) &&
                                  a.status === "completed",
                              )
                                ? 1
                                : 0;
                              const nonVocCount = visibleAnalyses.filter(
                                (a) =>
                                  !vocSubAnalyses.includes(a.type) &&
                                  a.status === "completed",
                              ).length;
                              const completedCount = vocCount + nonVocCount;
                              const expectedCount =
                                product.competitors.length > 0 ? 8 : 7;

                              return `${completedCount}/${expectedCount} analyses`;
                            })()}
                          </Badge>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/products/${product.id}`}>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-px bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions - 1 column */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                asChild
              >
                <Link href="/brands/new">
                  <Building2 className="h-4 w-4 mr-3" />
                  Create New Brand
                </Link>
              </Button>

              {brands > 0 && (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <Link href="/products/new">
                    <Package className="h-4 w-4 mr-3" />
                    Add Product
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Guide */}
        {brands === 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-xl">
                Getting Started with RevuIntel
              </CardTitle>
              <CardDescription>
                Transform your customer reviews into actionable insights in 3
                simple steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 bg-card rounded-lg shadow-sm border border-border flex items-center justify-center">
                      <span className="text-xl font-semibold text-primary">
                        1
                      </span>
                    </div>
                    <h4 className="font-medium text-foreground">
                      Create a Brand
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Start by creating a brand to organize your products
                    </p>
                  </div>
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-border" />
                </div>

                <div className="relative">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 bg-card rounded-lg shadow-sm border border-border flex items-center justify-center">
                      <span className="text-xl font-semibold text-primary">
                        2
                      </span>
                    </div>
                    <h4 className="font-medium text-foreground">
                      Upload Reviews
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Import your customer reviews via CSV file
                    </p>
                  </div>
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-border" />
                </div>

                <div className="relative">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 bg-card rounded-lg shadow-sm border border-border flex items-center justify-center">
                      <span className="text-xl font-semibold text-primary">
                        3
                      </span>
                    </div>
                    <h4 className="font-medium text-foreground">
                      Get AI Insights
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Receive 11 comprehensive AI-powered analyses
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button size="lg" asChild>
                  <Link href="/brands/new">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Start Your Journey
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
