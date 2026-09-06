-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "RfctlarrStage" AS ENUM ('INTAKE', 'SIA', 'SIA_APPRAISAL', 'SEC_11', 'SEC_19', 'AWARD', 'RR_COMPLETE');

-- CreateEnum
CREATE TYPE "ParcelClassification" AS ENUM ('RURAL', 'URBAN');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('SIA_REPORT', 'SEC_11_NOTIFICATION', 'SEC_19_DECLARATION', 'AWARD_ORDER', 'RR_SCHEME');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DOLR_SECRETARY', 'DISTRICT_COLLECTOR', 'LAO', 'STATE_REVENUE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('STAGE_ADVANCE', 'DOCUMENT_UPLOAD', 'DOCUMENT_VERIFY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "states" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "requiringBody" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "currentStage" "RfctlarrStage" NOT NULL,
    "stageEnteredAt" TIMESTAMP(3) NOT NULL,
    "initiatedAt" TIMESTAMP(3) NOT NULL,
    "affectedFamilies" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcels" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "ulpin" TEXT NOT NULL,
    "khasraNo" TEXT NOT NULL,
    "vernacularTerm" JSONB NOT NULL,
    "areaHa" DOUBLE PRECISION NOT NULL,
    "classification" "ParcelClassification" NOT NULL,
    "ownerName" TEXT NOT NULL,
    "coOwners" INTEGER NOT NULL,
    "compensationAssessed" DOUBLE PRECISION NOT NULL,
    "compensationDisbursed" DOUBLE PRECISION NOT NULL,
    "geom" geometry(Polygon, 4326),

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_refs" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sizeKb" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "fileData" BYTEA NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'application/pdf',
    "lastVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "document_refs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "fromStage" "RfctlarrStage",
    "toStage" "RfctlarrStage",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "parcels_ulpin_key" ON "parcels"("ulpin");

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_refs" ADD CONSTRAINT "document_refs_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
