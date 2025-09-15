-- Add variations column to Competitor table
ALTER TABLE "Competitor" ADD COLUMN "variations" JSONB;

-- The column is nullable by default, which is what we want
-- No need for a default value as existing competitors will have NULL