import { Product } from "@prisma/client";

interface ParsedMessage {
  html: string;
  mentionedProductIds: string[];
}

interface ProductWithBrand extends Product {
  brand: {
    id: string;
    name: string;
  };
}

export function parseProductMentions(
  message: string,
  products: ProductWithBrand[],
): ParsedMessage {
  let html = message;
  const mentionedProductIds: string[] = [];

  // Create a map of product names to IDs for quick lookup
  const productMap = new Map<string, string>();
  products.forEach((product) => {
    productMap.set(product.name.toLowerCase(), product.id);
  });

  // Find all @mentions in the message
  const mentionRegex = /@([^@\s]+(?:\s+[^@\s]+)*)/g;
  let match;

  while ((match = mentionRegex.exec(message)) !== null) {
    const mentionedName = match[1].trim().toLowerCase();
    const productId = productMap.get(mentionedName);

    if (productId) {
      mentionedProductIds.push(productId);

      // Replace @mention with formatted HTML
      const originalMention = match[0];
      const formattedMention = `<span class="product-mention" data-product-id="${productId}">@${match[1]}</span>`;
      html = html.replace(originalMention, formattedMention);
    }
  }

  return {
    html,
    mentionedProductIds: [...new Set(mentionedProductIds)], // Remove duplicates
  };
}

export function extractProductIdsFromMessage(
  message: string,
  products: ProductWithBrand[],
): string[] {
  const mentionedProductIds: string[] = [];
  const productMap = new Map<string, string>();

  products.forEach((product) => {
    productMap.set(product.name.toLowerCase(), product.id);
  });

  const mentionRegex = /@([^@\s]+(?:\s+[^@\s]+)*)/g;
  let match;

  while ((match = mentionRegex.exec(message)) !== null) {
    const mentionedName = match[1].trim().toLowerCase();
    const productId = productMap.get(mentionedName);

    if (productId) {
      mentionedProductIds.push(productId);
    }
  }

  return [...new Set(mentionedProductIds)];
}

export function getProductNamesFromIds(
  productIds: string[],
  products: ProductWithBrand[],
): string[] {
  const productMap = new Map<string, string>();
  products.forEach((product) => {
    productMap.set(product.id, product.name);
  });

  return productIds.map((id) => productMap.get(id)).filter(Boolean) as string[];
}
