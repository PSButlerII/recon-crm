-- CreateTable
CREATE TABLE "FileRecord" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "clientName" TEXT,
    "projectId" TEXT,
    "projectName" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Document',
    "size" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileRecord_pkey" PRIMARY KEY ("id")
);
