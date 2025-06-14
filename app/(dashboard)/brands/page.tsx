// app/(dashboard)/brands/page.tsx
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
import { BrandCard } from "@/components/brand-card";
import { Building2, Plus, Package } from "lucide-react";

async function getBrands(userId: string) {
  return prisma.brand.findMany({
    where: { userId },
    include: {
      products: {
        include: {
          _count: {
            select: { analyses: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function BrandsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const brands = await getBrands(session.user.id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brands</h1>
          <p className="text-gray-600 mt-1">
            Manage your brands and their products
          </p>
        </div>
        <Button asChild>
          <Link href="/brands/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Brand
          </Link>
        </Button>
      </div>

      {/* Brands Grid */}
      {brands.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <CardTitle className="mb-2">No brands yet</CardTitle>
            <CardDescription className="mb-6">
              Create your first brand to start organizing your products and
              analyses
            </CardDescription>
            <Button asChild>
              <Link href="/brands/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Brand
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      )}
    </div>
  );
}
