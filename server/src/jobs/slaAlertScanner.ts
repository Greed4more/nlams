import cron from "node-cron";
import { prisma } from "../db.js";
import { getSlaStatus } from "../lib/slaRules.js";
import { deliverAlert } from "../lib/notify.js";

export async function scanForSlaAlerts(): Promise<{ scanned: number; created: number }> {
  const proposals = await prisma.proposal.findMany({
    select: { id: true, projectName: true, currentStage: true, stageEnteredAt: true },
  });

  let created = 0;
  for (const p of proposals) {
    const { status, daysElapsed, daysRemaining } = getSlaStatus(p.currentStage, p.stageEnteredAt);
    if (status === "OK") continue;

    const existing = await prisma.slaAlert.findUnique({
      where: { proposalId_stage_status: { proposalId: p.id, stage: p.currentStage, status } },
    });
    if (existing) continue; // already alerted for this exact proposal+stage+status

    const alert = await prisma.slaAlert.create({
      data: { proposalId: p.id, stage: p.currentStage, status, daysElapsed, daysRemaining },
    });
    await deliverAlert({
      proposalId: p.id,
      projectName: p.projectName,
      stage: p.currentStage,
      status,
      daysElapsed,
      daysRemaining,
    });
    await prisma.slaAlert.update({ where: { id: alert.id }, data: { deliveredAt: new Date() } });
    created += 1;
  }

  return { scanned: proposals.length, created };
}

/** Runs scanForSlaAlerts on a cron schedule — SLA_SCAN_CRON in .env, hourly by default. */
export function startSlaAlertScheduler(): void {
  const schedule = process.env["SLA_SCAN_CRON"] ?? "0 * * * *";
  cron.schedule(schedule, () => {
    scanForSlaAlerts()
      .then(({ scanned, created }) => {
        if (created > 0) {
          console.log(`[sla-scanner] scanned ${scanned} proposals, ${created} new alert(s)`);
        }
      })
      .catch((error) => console.error("[sla-scanner] scan failed", error));
  });
  console.log(`[sla-scanner] scheduled: "${schedule}"`);
}
