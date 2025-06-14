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
import {
  BarChart3,
  Building2,
  Package,
  TrendingUp,
  Users,
  FileText,
  Plus,
  Activity,
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </div>
        <Button asChild>
          <Link href="/brands/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Brand
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands}</div>
            <p className="text-xs text-muted-foreground">
              Brands in your account
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Products analyzed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnalyses}</div>
            <p className="text-xs text-muted-foreground">Completed analyses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Completion
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalProducts > 0
                ? Math.round((totalAnalyses / (totalProducts * 11)) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Analysis completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Products
            </CardTitle>
            <CardDescription>Your latest product analyses</CardDescription>
          </CardHeader>
          <CardContent>
            {recentProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No products yet</p>
                <Button asChild variant="outline">
                  <Link href="/brands">Create your first brand</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-gray-600">
                        {product.brand.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.reviewsCount} reviews •{" "}
                        {product._count.analyses} analyses
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/products/${product.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
                {recentProducts.length >= 5 && (
                  <div className="text-center pt-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/brands">View all products</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with these common tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/brands/new">
                <Building2 className="h-4 w-4 mr-2" />
                Create New Brand
              </Link>
            </Button>

            {brands > 0 && (
              <Button
                asChild
                className="w-full justify-start"
                variant="outline"
              >
                <Link href="/brands">
                  <Package className="h-4 w-4 mr-2" />
                  Add Product to Brand
                </Link>
              </Button>
            )}

            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/brands">
                <BarChart3 className="h-4 w-4 mr-2" />
                View All Analyses
              </Link>
            </Button>

            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/profile">
                <Users className="h-4 w-4 mr-2" />
                Account Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      {brands === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Getting Started</CardTitle>
            <CardDescription className="text-blue-700">
              Follow these steps to start analyzing your customer reviews
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">Create a Brand</h4>
                  <p className="text-sm text-blue-700">
                    Start by creating a brand to organize your products
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">Add a Product</h4>
                  <p className="text-sm text-blue-700">
                    Upload a CSV file with customer reviews for analysis
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">Get AI Insights</h4>
                  <p className="text-sm text-blue-700">
                    Our AI will generate 11 different types of analysis
                    automatically
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button asChild>
                <Link href="/brands/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Brand
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
