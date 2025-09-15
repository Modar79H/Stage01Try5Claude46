// app/(dashboard)/products/page.tsx
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
import { ProductCard } from "@/components/product-card";
import { Package, Plus } from "lucide-react";

async function getProducts(userId: string) {
  return prisma.product.findMany({
    where: {
      brand: {
        userId,
      },
    },
    include: {
      brand: true,
      analyses: true,
      competitors: true,
      _count: {
        select: {
          analyses: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const products = await getProducts(session.user.id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            View and manage all your products across brands
          </p>
        </div>
        {products.length > 0 && (
          <Button asChild>
            <Link href="/brands">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        )}
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No products yet</CardTitle>
            <CardDescription className="mb-6">
              Create a brand first, then add products to start analyzing
              customer sentiment
            </CardDescription>
            <Button asChild>
              <Link href="/brands/new">
                <Plus className="h-4 w-4 mr-2" />
                Create a Brand
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              brandName={product.brand.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
