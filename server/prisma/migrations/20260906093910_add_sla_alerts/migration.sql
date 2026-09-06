-- CreateEnum
CREATE TYPE "SlaAlertStatus" AS ENUM ('AT_RISK', 'BREACHED');

-- CreateTable
CREATE TABLE "sla_alerts" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "stage" "RfctlarrStage" NOT NULL,
    "status" "SlaAlertStatus" NOT NULL,
    "daysElapsed" INTEGER NOT NULL,
    "daysRemaining" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "sla_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sla_alerts_proposalId_stage_status_key" ON "sla_alerts"("proposalId", "stage", "status");

-- AddForeignKey
ALTER TABLE "sla_alerts" ADD CONSTRAINT "sla_alerts_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
