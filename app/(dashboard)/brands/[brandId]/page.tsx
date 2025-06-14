// app/(dashboard)/brands/[brandId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
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
import { ProductCard } from "@/components/product-card";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  Package,
  Plus,
  BarChart3,
  TrendingUp,
} from "lucide-react";

async function getBrand(brandId: string, userId: string) {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      products: {
        include: {
          competitors: true,
          analyses: {
            where: { status: "completed" },
          },
          _count: {
            select: { analyses: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!brand || brand.userId !== userId) {
    return null;
  }

  return brand;
}

export default async function BrandDetailPage({
  params,
}: {
  params: { brandId: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const brand = await getBrand(params.brandId, session.user.id);

  if (!brand) {
    notFound();
  }

  const totalProducts = brand.products.length;
  const totalAnalyses = brand.products.reduce(
    (sum, product) => sum + product._count.analyses,
    0,
  );
  const totalReviews = brand.products.reduce(
    (sum, product) => sum + product.reviewsCount,
    0,
  );
  const processingProducts = brand.products.filter(
    (p) => p.isProcessing,
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/brands">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Brands
            </Link>
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">{brand.name}</h1>
            </div>
            <p className="text-gray-600 mt-1">
              Created {formatDate(brand.createdAt)}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/brands/${brand.id}/products/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Total products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalReviews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer reviews analyzed
            </p>
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
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <div
              className={`h-4 w-4 rounded-full ${processingProducts > 0 ? "bg-blue-600 animate-pulse" : "bg-gray-300"}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingProducts}</div>
            <p className="text-xs text-muted-foreground">Products processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          {totalProducts > 0 && (
            <Button asChild variant="outline">
              <Link href={`/brands/${brand.id}/products/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Add Another Product
              </Link>
            </Button>
          )}
        </div>

        {brand.products.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <CardTitle className="mb-2">No products yet</CardTitle>
              <CardDescription className="mb-6">
                Add your first product to start analyzing customer reviews
              </CardDescription>
              <Button asChild>
                <Link href={`/brands/${brand.id}/products/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brand.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                brandName={brand.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
