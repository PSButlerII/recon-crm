/*
  Warnings:

  - A unique constraint covering the columns `[serviceRequestId]` on the table `Project` will be added.
  - Existing duplicate service-request links are preserved as projects, but only the newest linked project keeps the serviceRequestId.

*/
WITH ranked_projects AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "serviceRequestId"
            ORDER BY "createdAt" DESC, "id" DESC
        ) AS duplicate_rank
    FROM "Project"
    WHERE "serviceRequestId" IS NOT NULL
)
UPDATE "Project"
SET "serviceRequestId" = NULL
WHERE "id" IN (
    SELECT "id"
    FROM ranked_projects
    WHERE duplicate_rank > 1
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_serviceRequestId_key" ON "Project"("serviceRequestId");
