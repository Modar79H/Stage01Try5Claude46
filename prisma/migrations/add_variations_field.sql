-- Add variations field to Product model
ALTER TABLE "Product" ADD COLUMN "variations" JSONB;

-- Add productVariation field to Review model (if not already present)
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "productVariation" TEXT;