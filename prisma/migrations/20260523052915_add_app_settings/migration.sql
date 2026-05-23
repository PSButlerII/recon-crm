-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL DEFAULT 'Recon Dev LLC',
    "defaultEmail" TEXT,
    "defaultHourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 35,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "paymentTerms" TEXT NOT NULL DEFAULT 'Due on receipt',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);
