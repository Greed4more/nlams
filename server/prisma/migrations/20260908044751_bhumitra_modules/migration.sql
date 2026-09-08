-- CreateEnum
CREATE TYPE "ParcelProvenance" AS ENUM ('ULPIN_VERIFIED', 'SVAMITVA_DIGITISED', 'LEGACY_MIGRATED', 'SELF_DECLARED_PENDING');

-- CreateEnum
CREATE TYPE "GrievanceStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'FIELD_VERIFICATION', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RiskTier" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'COMPENSATION_CALCULATED';
ALTER TYPE "AuditAction" ADD VALUE 'GRIEVANCE_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE 'GRIEVANCE_RESOLVED';
ALTER TYPE "AuditAction" ADD VALUE 'RISK_SCORED';

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "chainHash" TEXT,
ADD COLUMN     "eventPayloadHash" TEXT,
ADD COLUMN     "fileHash" TEXT,
ADD COLUMN     "previousHash" TEXT;

-- AlterTable
ALTER TABLE "parcels" ADD COLUMN     "provenance" "ParcelProvenance" NOT NULL DEFAULT 'LEGACY_MIGRATED',
ADD COLUMN     "restrictionFlags" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "consentPercentage" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "compensation_records" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "marketValue" DOUBLE PRECISION NOT NULL,
    "ruralMultiplier" DOUBLE PRECISION NOT NULL,
    "assetValue" DOUBLE PRECISION NOT NULL,
    "solatium" DOUBLE PRECISION NOT NULL,
    "interestAmount" DOUBLE PRECISION NOT NULL,
    "totalCompensation" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "pfmsReceipt" JSONB NOT NULL,
    "calculatedByUserId" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compensation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grievance_tickets" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "parcelId" TEXT,
    "submittedByUserId" TEXT NOT NULL,
    "issueCategory" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "status" "GrievanceStatus" NOT NULL DEFAULT 'SUBMITTED',
    "slaDeadline" TIMESTAMP(3) NOT NULL,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "grievance_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_scores" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskTier" "RiskTier" NOT NULL,
    "topContributingFactors" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "state_adapters" (
    "id" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "adapterName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncStatus" TEXT NOT NULL DEFAULT 'idle',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "state_adapters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "state_adapters_stateCode_key" ON "state_adapters"("stateCode");

-- AddForeignKey
ALTER TABLE "compensation_records" ADD CONSTRAINT "compensation_records_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compensation_records" ADD CONSTRAINT "compensation_records_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compensation_records" ADD CONSTRAINT "compensation_records_calculatedByUserId_fkey" FOREIGN KEY ("calculatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grievance_tickets" ADD CONSTRAINT "grievance_tickets_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grievance_tickets" ADD CONSTRAINT "grievance_tickets_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grievance_tickets" ADD CONSTRAINT "grievance_tickets_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_scores" ADD CONSTRAINT "risk_scores_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
