/**
 * Section 26 / First Schedule compensation computation — RFCTLARR Act, 2013.
 * Pure, dependency-free so it can be unit tested or reused server-side.
 */

export interface CompensationInput {
  areaHa: number;
  marketValuePerHa: number;
  classification: "RURAL" | "URBAN";
  /** Distance from the nearest urban centre, km. Ignored for urban land. */
  distanceFromUrbanKm: number;
  trees: number;
  structures: number;
  wells: number;
  /** ISO date strings */
  siaNotificationDate: string;
  awardDate: string;
}

export interface CompensationRow {
  key: string;
  label: string;
  value: number;
  statute: string;
}

export interface CompensationResult {
  baseLandValue: number;
  factor: number;
  multipliedLandValue: number;
  assetValue: number;
  subtotal: number;
  solatium: number;
  interest: number;
  interestDays: number;
  finalAward: number;
  effectiveMultiple: number;
  rows: CompensationRow[];
}

/** First Schedule factor: 1.00 for urban; rural rises linearly 1.00 → 2.00 over 0–30 km. */
export function multiplicationFactor(
  classification: "RURAL" | "URBAN",
  distanceKm: number,
): number {
  if (classification === "URBAN") return 1;
  const d = Math.max(0, Math.min(30, distanceKm));
  return Number((1 + d / 30).toFixed(2));
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso).getTime();
  const b = new Date(toIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
}

export function computeCompensation(input: CompensationInput): CompensationResult {
  const baseLandValue = Math.max(0, input.areaHa) * Math.max(0, input.marketValuePerHa);
  const factor = multiplicationFactor(input.classification, input.distanceFromUrbanKm);
  const multipliedLandValue = baseLandValue * factor;
  const assetValue =
    Math.max(0, input.trees) + Math.max(0, input.structures) + Math.max(0, input.wells);
  const subtotal = multipliedLandValue + assetValue;
  const solatium = subtotal; // 100% of subtotal — Sec. 30(1)
  const interestDays = daysBetween(input.siaNotificationDate, input.awardDate);
  const interest = baseLandValue * 0.12 * (interestDays / 365);
  const finalAward = subtotal + solatium + interest;
  const effectiveMultiple = baseLandValue > 0 ? finalAward / baseLandValue : 0;

  const rows: CompensationRow[] = [
    { key: "base", label: "Base Land Value (area × market value)", value: baseLandValue, statute: "Sec. 26" },
    { key: "factor", label: "Multiplication Factor", value: factor, statute: "First Schedule" },
    { key: "multiplied", label: "Multiplied Land Value", value: multipliedLandValue, statute: "Sec. 26(1)" },
    { key: "assets", label: "Value of Attached Assets", value: assetValue, statute: "Sec. 29" },
    { key: "subtotal", label: "Subtotal", value: subtotal, statute: "Sec. 27" },
    { key: "solatium", label: "Solatium @ 100% of subtotal", value: solatium, statute: "Sec. 30(1)" },
    { key: "interest", label: "Interest @ 12% p.a. (SIA notification → award)", value: interest, statute: "Sec. 30(3)" },
  ];

  return {
    baseLandValue,
    factor,
    multipliedLandValue,
    assetValue,
    subtotal,
    solatium,
    interest,
    interestDays,
    finalAward,
    effectiveMultiple,
    rows,
  };
}
