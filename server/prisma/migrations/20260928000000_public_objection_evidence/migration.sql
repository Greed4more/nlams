-- AlterTable
ALTER TABLE "grievance_tickets" ADD COLUMN "evidenceName" TEXT,
ADD COLUMN "evidenceType" TEXT,
ADD COLUMN "evidenceData" BYTEA;
