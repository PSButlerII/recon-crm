/*
  Warnings:

  - A unique constraint covering the column `[intakeSubmissionId]` on the table `ServiceRequest` will be added.
  - Existing duplicate intake links are preserved as service requests, but only the newest linked request keeps the intakeSubmissionId.
  - PostgreSQL allows multiple NULL values in a unique index, so manual service requests without intakeSubmissionId remain valid.

*/
WITH ranked_service_requests AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "intakeSubmissionId"
            ORDER BY "createdAt" DESC, "id" DESC
        ) AS duplicate_rank
    FROM "ServiceRequest"
    WHERE "intakeSubmissionId" IS NOT NULL
)
UPDATE "ServiceRequest"
SET "intakeSubmissionId" = NULL
WHERE "id" IN (
    SELECT "id"
    FROM ranked_service_requests
    WHERE duplicate_rank > 1
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_intakeSubmissionId_key" ON "ServiceRequest"("intakeSubmissionId");
