-- Add token count to messages table
ALTER TABLE "Message" ADD COLUMN "tokens" INTEGER;

-- Create BrandSummary table
CREATE TABLE "BrandSummary" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "insights" JSONB NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandSummary_pkey" PRIMARY KEY ("id")
);

-- Create ProductSummary table
CREATE TABLE "ProductSummary" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyInsights" JSONB NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "pineconeId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSummary_pkey" PRIMARY KEY ("id")
);

-- Create AnalysisChunk table
CREATE TABLE "AnalysisChunk" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "totalChunks" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "pineconeId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisChunk_pkey" PRIMARY KEY ("id")
);

-- Create ConversationSummary table
CREATE TABLE "ConversationSummary" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "messageCount" INTEGER NOT NULL,
    "startMessageId" TEXT NOT NULL,
    "endMessageId" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationSummary_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "BrandSummary_brandId_key" ON "BrandSummary"("brandId");
CREATE UNIQUE INDEX "ProductSummary_productId_key" ON "ProductSummary"("productId");
CREATE UNIQUE INDEX "AnalysisChunk_pineconeId_key" ON "AnalysisChunk"("pineconeId");
CREATE UNIQUE INDEX "AnalysisChunk_productId_analysisType_chunkIndex_key" ON "AnalysisChunk"("productId", "analysisType", "chunkIndex");

-- Create regular indexes
CREATE INDEX "BrandSummary_brandId_idx" ON "BrandSummary"("brandId");
CREATE INDEX "ProductSummary_productId_idx" ON "ProductSummary"("productId");
CREATE INDEX "AnalysisChunk_brandId_idx" ON "AnalysisChunk"("brandId");
CREATE INDEX "AnalysisChunk_productId_idx" ON "AnalysisChunk"("productId");
CREATE INDEX "AnalysisChunk_analysisType_idx" ON "AnalysisChunk"("analysisType");
CREATE INDEX "AnalysisChunk_pineconeId_idx" ON "AnalysisChunk"("pineconeId");
CREATE INDEX "ConversationSummary_conversationId_idx" ON "ConversationSummary"("conversationId");

-- Add foreign key constraints
ALTER TABLE "BrandSummary" ADD CONSTRAINT "BrandSummary_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSummary" ADD CONSTRAINT "ProductSummary_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalysisChunk" ADD CONSTRAINT "AnalysisChunk_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalysisChunk" ADD CONSTRAINT "AnalysisChunk_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationSummary" ADD CONSTRAINT "ConversationSummary_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;