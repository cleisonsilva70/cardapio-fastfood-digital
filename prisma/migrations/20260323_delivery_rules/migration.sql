ALTER TABLE "StoreSettings"
ADD COLUMN "defaultDeliveryFee" DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN "estimatedDeliveryMin" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "estimatedDeliveryMax" INTEGER NOT NULL DEFAULT 45,
ADD COLUMN "deliveryAreasJson" TEXT;

ALTER TABLE "Order"
ADD COLUMN "deliveryArea" TEXT,
ADD COLUMN "estimatedDeliveryMin" INTEGER,
ADD COLUMN "estimatedDeliveryMax" INTEGER;
