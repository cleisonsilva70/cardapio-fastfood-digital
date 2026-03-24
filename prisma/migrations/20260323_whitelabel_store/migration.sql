-- CreateTable
CREATE TABLE "public"."Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StoreSettings" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#b8441f',
    "secondaryColor" TEXT NOT NULL DEFAULT '#ffbf47',
    "accentColor" TEXT NOT NULL DEFAULT '#23150f',
    "heroTitle" TEXT NOT NULL,
    "heroDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- Create default store
INSERT INTO "public"."Store" ("id", "name", "slug", "status", "createdAt", "updatedAt")
VALUES ('store_brasa_burger_house', 'Brasa Burger House', 'brasa-burger-house', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- Create default store settings
INSERT INTO "public"."StoreSettings" (
  "id",
  "storeId",
  "whatsappNumber",
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "heroTitle",
  "heroDescription",
  "createdAt",
  "updatedAt"
)
VALUES (
  'store_settings_brasa_burger_house',
  'store_brasa_burger_house',
  '5584987330515',
  '#b8441f',
  '#ffbf47',
  '#23150f',
  'Brasa Burger House',
  'Catálogo digital, checkout rápido e painel de cozinha para uma operação enxuta e profissional.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("storeId") DO NOTHING;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN "storeId" TEXT;
ALTER TABLE "public"."Order" ADD COLUMN "storeId" TEXT;

-- Backfill existing records
UPDATE "public"."Product"
SET "storeId" = 'store_brasa_burger_house'
WHERE "storeId" IS NULL;

UPDATE "public"."Order"
SET "storeId" = 'store_brasa_burger_house'
WHERE "storeId" IS NULL;

-- Set not null
ALTER TABLE "public"."Product" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "public"."Order" ALTER COLUMN "storeId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Store_slug_key" ON "public"."Store"("slug");
CREATE UNIQUE INDEX "StoreSettings_storeId_key" ON "public"."StoreSettings"("storeId");

-- AddForeignKey
ALTER TABLE "public"."StoreSettings" ADD CONSTRAINT "StoreSettings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
