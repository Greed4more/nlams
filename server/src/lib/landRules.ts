/**
 * State-wise land-rate reference tables backing the Finance Officer's
 * automatic compensation engine. Real deployments source these from the
 * state's circle-rate notification + the top-half sale-deed averages the
 * District Registrar publishes annually (RFCTLARR First Schedule, Sec. 26
 * explanation). This demo keeps them as a small, versioned lookup so the
 * engine is deterministic and auditable.
 */

export const LAND_RULES_VERSION = "LAND-RATES-2026.09";

export interface StateLandRule {
  state: string;
  /** Circle rate, ₹ per hectare, rural classification. */
  ruralCircleRatePerHa: number;
  /** Circle rate, ₹ per hectare, urban classification. */
  urbanCircleRatePerHa: number;
  /** Representative distance to the nearest urban centre for rural land, km —
   * feeds the First Schedule multiplier bands. */
  ruralDistanceFromUrbanKm: number;
}

const DEFAULT_RULE: StateLandRule = {
  state: "Default",
  ruralCircleRatePerHa: 30_00_000,
  urbanCircleRatePerHa: 90_00_000,
  ruralDistanceFromUrbanKm: 12,
};

/**
 * Reference rates for the states this deployment carries live records for,
 * plus the states used by the demo finance persona. ₹/Ha values are plausible
 * 2026 circle rates, deliberately uneven so assessments vary by state.
 */
export const STATE_LAND_RULES: Record<string, StateLandRule> = {
  Maharashtra: {
    state: "Maharashtra",
    ruralCircleRatePerHa: 42_00_000,
    urbanCircleRatePerHa: 1_25_00_000,
    ruralDistanceFromUrbanKm: 14,
  },
  "Tamil Nadu": {
    state: "Tamil Nadu",
    ruralCircleRatePerHa: 35_00_000,
    urbanCircleRatePerHa: 96_00_000,
    ruralDistanceFromUrbanKm: 11,
  },
  Assam: {
    state: "Assam",
    ruralCircleRatePerHa: 12_50_000,
    urbanCircleRatePerHa: 42_00_000,
    ruralDistanceFromUrbanKm: 18,
  },
  Goa: {
    state: "Goa",
    ruralCircleRatePerHa: 58_00_000,
    urbanCircleRatePerHa: 1_62_00_000,
    ruralDistanceFromUrbanKm: 8,
  },
  Punjab: {
    state: "Punjab",
    ruralCircleRatePerHa: 48_00_000,
    urbanCircleRatePerHa: 1_08_00_000,
    ruralDistanceFromUrbanKm: 10,
  },
  Karnataka: {
    state: "Karnataka",
    ruralCircleRatePerHa: 38_00_000,
    urbanCircleRatePerHa: 1_12_00_000,
    ruralDistanceFromUrbanKm: 12,
  },
  Kerala: {
    state: "Kerala",
    ruralCircleRatePerHa: 52_00_000,
    urbanCircleRatePerHa: 1_45_00_000,
    ruralDistanceFromUrbanKm: 9,
  },
  Haryana: {
    state: "Haryana",
    ruralCircleRatePerHa: 62_00_000,
    urbanCircleRatePerHa: 1_38_00_000,
    ruralDistanceFromUrbanKm: 7,
  },
  Gujarat: {
    state: "Gujarat",
    ruralCircleRatePerHa: 34_00_000,
    urbanCircleRatePerHa: 92_00_000,
    ruralDistanceFromUrbanKm: 13,
  },
  "Uttar Pradesh": {
    state: "Uttar Pradesh",
    ruralCircleRatePerHa: 28_00_000,
    urbanCircleRatePerHa: 82_00_000,
    ruralDistanceFromUrbanKm: 15,
  },
};

export function landRuleFor(state: string): StateLandRule {
  return STATE_LAND_RULES[state] ?? { ...DEFAULT_RULE, state };
}

/** Deterministic [0,1) value derived from a string — keeps per-parcel market
 * variation stable across recomputations, so a re-run of the engine never
 * changes figures an officer already reviewed. */
export function hashToUnit(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return (h % 10_000) / 10_000;
}
