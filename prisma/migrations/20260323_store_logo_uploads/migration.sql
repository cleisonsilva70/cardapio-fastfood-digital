ALTER TABLE "public"."StoreSettings"
  ADD COLUMN IF NOT EXISTS "shortName" TEXT,
  ADD COLUMN IF NOT EXISTS "logoText" TEXT,
  ADD COLUMN IF NOT EXISTS "logoPath" TEXT;

UPDATE "public"."StoreSettings"
SET
  "shortName" = COALESCE("shortName", 'Brasa Burger'),
  "logoText" = COALESCE("logoText", 'BB')
WHERE "shortName" IS NULL OR "logoText" IS NULL;

ALTER TABLE "public"."StoreSettings" ALTER COLUMN "shortName" SET NOT NULL;
ALTER TABLE "public"."StoreSettings" ALTER COLUMN "logoText" SET NOT NULL;
