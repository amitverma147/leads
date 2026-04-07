-- CreateTable
CREATE TABLE "invoice_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hsnCode" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "taxRatePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "invoice_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoice_products_organizationId_idx" ON "invoice_products"("organizationId");

-- CreateIndex
CREATE INDEX "invoice_products_name_idx" ON "invoice_products"("name");

-- CreateIndex
CREATE INDEX "invoice_products_hsnCode_idx" ON "invoice_products"("hsnCode");

-- AddForeignKey
ALTER TABLE "invoice_products" ADD CONSTRAINT "invoice_products_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
