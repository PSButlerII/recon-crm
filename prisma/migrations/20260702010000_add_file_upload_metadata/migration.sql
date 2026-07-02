-- Add local upload metadata fields to FileRecord while preserving existing metadata-only rows.
ALTER TABLE "FileRecord"
  ADD COLUMN "originalName" TEXT,
  ADD COLUMN "mimeType" TEXT,
  ADD COLUMN "sizeBytes" INTEGER,
  ADD COLUMN "storagePath" TEXT,
  ADD COLUMN "relativePath" TEXT;
