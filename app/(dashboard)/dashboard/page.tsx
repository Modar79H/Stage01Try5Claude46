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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Welcome back!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {session.user.name || session.user.email} • Here's your business
            overview
          </p>
        </div>
        <Button variant="gradient" size="lg" asChild>
          <Link href="/brands/new">
            <Plus className="h-5 w-5 mr-2" />
            Create Brand
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="glass" hover>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Brands
            </CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{brands}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              Active brands
            </p>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Products
            </CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Products analyzed
            </p>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              AI Analyses
            </CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAnalyses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Insights generated
            </p>
          </CardContent>
        </Card>

        <Card variant="glass" hover>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completion Rate
            </CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalProducts > 0
                ? Math.round((totalAnalyses / (totalProducts * 11)) * 100)
                : 0}
              %
            </div>
            <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${totalProducts > 0 ? Math.round((totalAnalyses / (totalProducts * 11)) * 100) : 0}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Products - 2 columns */}
        <Card className="lg:col-span-2" variant="gradient" hover={false}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                <CardTitle>Recent Products</CardTitle>
              </div>
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
                <p className="text-gray-600 dark:text-gray-400 mb-1 font-medium">
                  No products yet
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
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
                    className="group relative overflow-hidden rounded-lg border bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Package className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {product.name}
                            </h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>{product.brand.name}</span>
                              <span>•</span>
                              <span>{product.reviewsCount} reviews</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="info" size="sm">
                          {product._count.analyses} analyses
                        </Badge>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/products/${product.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions - 1 column */}
        <Card hover={false}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <CardTitle>Quick Actions</CardTitle>
            </div>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" asChild>
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
                <Link href="/brands">
                  <Package className="h-4 w-4 mr-3" />
                  Add Product
                </Link>
              </Button>
            )}

            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/analytics">
                <BarChart3 className="h-4 w-4 mr-3" />
                View Analytics
              </Link>
            </Button>

            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/settings">
                <Users className="h-4 w-4 mr-3" />
                Account Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Guide */}
      {brands === 0 && (
        <Card
          variant="gradient"
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800"
        >
          <CardHeader>
            <CardTitle className="text-2xl text-blue-900 dark:text-blue-100">
              🚀 Getting Started with RevuIntel
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Transform your customer reviews into actionable insights in 3
              simple steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      1
                    </span>
                  </div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    Create a Brand
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Start by creating a brand to organize your products
                  </p>
                </div>
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 to-transparent" />
              </div>

              <div className="relative">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      2
                    </span>
                  </div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    Upload Reviews
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Import your customer reviews via CSV file
                  </p>
                </div>
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 to-transparent" />
              </div>

              <div className="relative">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex items-center justify-center">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      3
                    </span>
                  </div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    Get AI Insights
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Receive 11 comprehensive AI-powered analyses
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button size="lg" variant="gradient" asChild>
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
  );
}
