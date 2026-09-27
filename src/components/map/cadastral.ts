import type { ParcelFeatureProperties } from "@/hooks/useParcels";
import type { WbParcelFeatureProperties } from "@/hooks/useWbParcels";
import type { BlockFeatureProperties, DistrictFeatureProperties } from "@/hooks/useAdminBoundaries";

export type ParcelStatus = "ACQUIRED" | "UNDER_AWARD" | "DISPUTED" | "NOTIFIED";

/** Anything the GIS canvas can have selected — drives the right inspector. */
export type Selection =
  | { kind: "parcel"; properties: ParcelFeatureProperties; centroid: [number, number] }
  | { kind: "district"; properties: DistrictFeatureProperties; centroid: [number, number] }
  | { kind: "block"; properties: BlockFeatureProperties; centroid: [number, number] }
  | {
      kind: "wbParcel";
      properties: WbParcelFeatureProperties;
      district: string;
      centroid: [number, number];
    };

export const PARCEL_STATUS_COLOR: Record<ParcelStatus, string> = {
  ACQUIRED: "#1a9c5c",
  UNDER_AWARD: "#2563eb",
  DISPUTED: "#dc2626",
  NOTIFIED: "#d97706",
};

export const PARCEL_STATUS_LABEL: Record<ParcelStatus, string> = {
  ACQUIRED: "Acquired",
  UNDER_AWARD: "Under Award",
  DISPUTED: "Disputed",
  NOTIFIED: "Notified",
};

const STATUS_TONE: Record<ParcelStatus, string> = {
  ACQUIRED: "border-status-ok/30 bg-status-ok/10 text-status-ok",
  UNDER_AWARD: "border-status-info/30 bg-status-info/10 text-status-info",
  DISPUTED: "border-status-critical/30 bg-status-critical/10 text-status-critical",
  NOTIFIED: "border-status-warn/30 bg-status-warn/10 text-status-warn",
};

export function statusTone(status: ParcelStatus): string {
  return STATUS_TONE[status];
}

/** Stable per-parcel acquisition status for the demo — derived from the ULPIN
 * until a real parcel-status feed is wired in. */
export function statusFor(ulpin: string): ParcelStatus {
  const codes: ParcelStatus[] = ["ACQUIRED", "UNDER_AWARD", "DISPUTED", "NOTIFIED"];
  const sum = [...ulpin].reduce((s, c) => s + c.charCodeAt(0), 0);
  return codes[sum % codes.length]!;
}

/** khasraNo is generated as "<survey>/<sub-division>" — split it back apart. */
export function splitKhasra(khasraNo: string): { survey: string; subDivision: string | null } {
  const [survey, sub] = khasraNo.split("/");
  return { survey: survey ?? khasraNo, subDivision: sub ?? null };
}

const ACRE_PER_HA = 2.47105;

export function toAcres(areaHa: number): number {
  return areaHa * ACRE_PER_HA;
}

export type PaymentTone = "ok" | "info" | "warn" | "muted";

export interface PaymentState {
  label: string;
  tone: PaymentTone;
}

/** Payment approval tag derived from the assessed/disbursed pair. */
export function paymentState(assessed: number, disbursed: number): PaymentState {
  if (assessed <= 0) return { label: "Not assessed", tone: "muted" };
  if (disbursed <= 0) return { label: "Pending Approval", tone: "warn" };
  if (disbursed < assessed) return { label: "Partially Disbursed", tone: "info" };
  return { label: "Approved & Disbursed", tone: "ok" };
}

export const PAYMENT_TONE_CLASS: Record<PaymentTone, string> = {
  ok: "border-status-ok/30 bg-status-ok/10 text-status-ok",
  info: "border-status-info/30 bg-status-info/10 text-status-info",
  warn: "border-status-warn/30 bg-status-warn/10 text-status-warn",
  muted: "border-border bg-muted text-muted-foreground",
};
