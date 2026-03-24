-- CreateTable
CREATE TABLE "public"."StoreBanner" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreBanner_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "public"."StoreSettings"
  ADD COLUMN "phoneDisplay" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "openingHours" TEXT,
  ADD COLUMN "surfaceColor" TEXT NOT NULL DEFAULT '#fff9f2',
  ADD COLUMN "eyebrow" TEXT,
  ADD COLUMN "tagline" TEXT;

UPDATE "public"."StoreSettings"
SET
  "phoneDisplay" = '(84) 98733-0515',
  "address" = 'Rua Lindalva, 175',
  "openingHours" = '18:00 as 23:30',
  "eyebrow" = 'Cardapio digital + cozinha',
  "tagline" = 'Smash burgers, combos, fritas e operacao organizada em uma unica base.'
WHERE "phoneDisplay" IS NULL;

ALTER TABLE "public"."StoreSettings" ALTER COLUMN "phoneDisplay" SET NOT NULL;
ALTER TABLE "public"."StoreSettings" ALTER COLUMN "address" SET NOT NULL;
ALTER TABLE "public"."StoreSettings" ALTER COLUMN "openingHours" SET NOT NULL;
ALTER TABLE "public"."StoreSettings" ALTER COLUMN "eyebrow" SET NOT NULL;
ALTER TABLE "public"."StoreSettings" ALTER COLUMN "tagline" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."StoreBanner" ADD CONSTRAINT "StoreBanner_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
