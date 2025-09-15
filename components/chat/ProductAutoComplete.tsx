"use client";

import { useState, useEffect, useRef } from "react";
import { Product } from "@prisma/client";

interface ProductAutoCompleteProps {
  brandId: string;
  searchTerm: string;
  position: { top: number; left: number };
  onSelect: (product: Product) => void;
  onClose: () => void;
  isVisible: boolean;
}

interface ProductWithBrand extends Product {
  brand: {
    id: string;
    name: string;
  };
}

export function ProductAutoComplete({
  brandId,
  searchTerm,
  position,
  onSelect,
  onClose,
  isVisible,
}: ProductAutoCompleteProps) {
  const [products, setProducts] = useState<ProductWithBrand[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !searchTerm) {
      setProducts([]);
      return;
    }

    const loadProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/brands/${brandId}/products`);
        if (response.ok) {
          const data = await response.json();
          const filteredProducts = data.products.filter(
            (product: ProductWithBrand) =>
              product.name.toLowerCase().includes(searchTerm.toLowerCase()),
          );
          setProducts(filteredProducts);
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [brandId, searchTerm, isVisible]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || products.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % products.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + products.length) % products.length,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (products[selectedIndex]) {
            onSelect(products[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "Tab":
          e.preventDefault();
          if (products[selectedIndex]) {
            onSelect(products[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, products, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isVisible, onClose]);

  if (!isVisible || (!loading && products.length === 0)) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-50 w-64 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {loading ? (
        <div className="p-3 text-center text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <div className="py-1">
          {products.map((product, index) => (
            <div
              key={product.id}
              className={`px-3 py-2 cursor-pointer flex items-center space-x-3 ${
                index === selectedIndex
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
              }`}
              onClick={() => onSelect(product)}
            >
              <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-muted-foreground">
                  {product.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{product.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {product.reviewsCount.toLocaleString()} reviews
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
