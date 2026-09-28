-- Finance Officer module: dedicated role, financial clearance state, and the
-- persisted automatic-compensation assessment approved by the Finance Officer.
-- ALTER TYPE ... ADD VALUE is safe inside Prisma's migration transaction on
-- Postgres 12+ as long as the new label isn't used in the same transaction —
-- none of the new labels below are used by this migration's other statements.

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'FINANCE_OFFICER';

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'FINANCIAL_ASSESSMENT_CALCULATED';

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'FINANCIAL_ASSESSMENT_APPROVED';

-- CreateEnum
CREATE TYPE "FinancialStatus" AS ENUM ('PENDING', 'APPROVED');

-- AlterTable
ALTER TABLE "proposals"
  ADD COLUMN "financialStatus" "FinancialStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "financial_assessments" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "totalLandValue" DOUBLE PRECISION NOT NULL,
    "totalAssetValue" DOUBLE PRECISION NOT NULL,
    "totalSolatium" DOUBLE PRECISION NOT NULL,
    "totalInterest" DOUBLE PRECISION NOT NULL,
    "totalCompensation" DOUBLE PRECISION NOT NULL,
    "beneficiaryCount" INTEGER NOT NULL,
    "beneficiaries" JSONB NOT NULL,
    "landRulesVersion" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "financial_assessments_proposalId_key" ON "financial_assessments"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "financial_assessments_referenceNumber_key" ON "financial_assessments"("referenceNumber");

-- AddForeignKey
ALTER TABLE "financial_assessments"
  ADD CONSTRAINT "financial_assessments_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "proposals"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_assessments"
  ADD CONSTRAINT "financial_assessments_approvedByUserId_fkey"
  FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
