DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDENTE', 'PAGO', 'FALHOU', 'CANCELADO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Order"
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PAGO',
ADD COLUMN "paymentCode" TEXT,
ADD COLUMN "paymentConfirmedAt" TIMESTAMP(3);

ALTER TABLE "Order"
ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDENTE';
