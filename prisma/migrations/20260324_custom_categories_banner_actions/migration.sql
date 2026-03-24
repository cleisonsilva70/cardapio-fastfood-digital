-- AlterTable
ALTER TABLE "Product"
ALTER COLUMN "category" TYPE TEXT
USING "category"::text;

-- AlterTable
ALTER TABLE "StoreBanner"
ADD COLUMN "ctaMode" TEXT NOT NULL DEFAULT 'LINK',
ADD COLUMN "ctaProductId" TEXT;

-- DropEnum
DROP TYPE "ProductCategory";
