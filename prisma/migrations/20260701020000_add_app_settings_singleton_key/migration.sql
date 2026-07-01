-- Add a stable singleton key so settings can be upserted idempotently.
ALTER TABLE "AppSettings" ADD COLUMN "key" TEXT NOT NULL DEFAULT 'default';

-- App settings are a singleton; keep the oldest row if duplicates were created before this constraint.
DELETE FROM "AppSettings"
WHERE "id" NOT IN (
    SELECT "id"
    FROM "AppSettings"
    ORDER BY "createdAt" ASC, "id" ASC
    LIMIT 1
);

-- Keep one logical settings row addressable by key.
CREATE UNIQUE INDEX "AppSettings_key_key" ON "AppSettings"("key");
