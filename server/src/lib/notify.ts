export interface AlertPayload {
  proposalId: string;
  projectName: string;
  stage: string;
  status: "AT_RISK" | "BREACHED";
  daysElapsed: number;
  daysRemaining: number;
}

/**
 * Delivery channel for SLA alerts. Defaults to a structured log line — no
 * external account needed. To actually notify someone outside the app, swap
 * this body for a real provider call, e.g.:
 *
 *   Email — Resend (https://resend.com): add RESEND_API_KEY to server/.env,
 *     `new Resend(process.env.RESEND_API_KEY).emails.send({...})`
 *   SMS — MSG91 or Twilio: add MSG91_AUTH_KEY / TWILIO_* to server/.env
 *
 * Called once per new alert by server/src/jobs/slaAlertScanner.ts.
 */
export async function deliverAlert(alert: AlertPayload): Promise<void> {
  console.warn(
    `[SLA ALERT] ${alert.status} — ${alert.proposalId} (${alert.projectName}) at ${alert.stage}: ` +
      `${alert.daysElapsed}d elapsed, ${alert.daysRemaining}d remaining`,
  );
}
