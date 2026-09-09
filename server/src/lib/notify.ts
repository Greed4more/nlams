import { Resend } from "resend";

export interface AlertPayload {
  proposalId: string;
  projectName: string;
  stage: string;
  status: "AT_RISK" | "BREACHED";
  daysElapsed: number;
  daysRemaining: number;
}

const resendApiKey = process.env["RESEND_API_KEY"];
const alertFrom = process.env["ALERT_EMAIL_FROM"] ?? "NLAMS Alerts <alerts@nlams.dev>";
const alertTo = process.env["ALERT_EMAIL_TO"];
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function logAlert(alert: AlertPayload): void {
  console.warn(
    `[SLA ALERT] ${alert.status} — ${alert.proposalId} (${alert.projectName}) at ${alert.stage}: ` +
      `${alert.daysElapsed}d elapsed, ${alert.daysRemaining}d remaining`,
  );
}

function renderAlertEmail(alert: AlertPayload): { subject: string; html: string } {
  const severity = alert.status === "BREACHED" ? "Statutory deadline BREACHED" : "Statutory deadline at risk";
  return {
    subject: `[NLAMS] ${severity}: ${alert.projectName} (${alert.proposalId})`,
    html: `
      <p><strong>${severity}</strong></p>
      <table cellpadding="4" cellspacing="0">
        <tr><td>Proposal</td><td>${alert.proposalId} — ${alert.projectName}</td></tr>
        <tr><td>Stage</td><td>${alert.stage}</td></tr>
        <tr><td>Days elapsed</td><td>${alert.daysElapsed}</td></tr>
        <tr><td>Days remaining</td><td>${alert.daysRemaining}</td></tr>
      </table>
    `,
  };
}

/**
 * Delivery channel for SLA alerts. Sends via Resend when RESEND_API_KEY and
 * ALERT_EMAIL_TO are configured in server/.env; otherwise falls back to a
 * structured log line so the scanner keeps working with no external account.
 * A delivery failure is logged, not thrown — it must never fail the scan.
 *
 * SMS is not wired up: to add it, follow the same pattern with MSG91 or
 * Twilio behind MSG91_AUTH_KEY / TWILIO_* env vars.
 *
 * Called once per new alert by server/src/jobs/slaAlertScanner.ts.
 */
export async function deliverAlert(alert: AlertPayload): Promise<void> {
  logAlert(alert);

  if (!resend || !alertTo) return;

  const { subject, html } = renderAlertEmail(alert);
  try {
    await resend.emails.send({ from: alertFrom, to: alertTo, subject, html });
  } catch (error) {
    console.error("[notify] Resend delivery failed", error);
  }
}
