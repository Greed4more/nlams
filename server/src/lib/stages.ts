import type { RfctlarrStage, Role } from "@prisma/client";

/** Statutory order of RFCTLARR stages — mirrors src/data/mockData.ts STAGE_ORDER. */
export const STAGE_ORDER: RfctlarrStage[] = [
  "INTAKE",
  "SIA",
  "SIA_APPRAISAL",
  "SEC_11",
  "SEC_19",
  "AWARD",
  "RR_COMPLETE",
];

export function nextStage(current: RfctlarrStage): RfctlarrStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1]!;
}

/** Only the Land Acquisition Officer persona may execute statutory actions. */
export function canAct(role: Role): boolean {
  return role === "LAO";
}
