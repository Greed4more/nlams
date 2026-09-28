/**
 * Automatic compensation calculation engine for the Finance Officer module.
 *
 * Walks every affected parcel of an LAO-approved proposal and computes the
 * statutory payout per beneficiary (parcel) from:
 *   - land rules: state-wise circle rates + urban distance bands
 *     (server/src/lib/landRules.ts)
 *   - parcel data: extents, classification, survey number, ownership
 *   - the Sec. 26-30 award engine (server/src/lib/compensationCalc.ts)
 *
 * The same function backs both the on-screen preview and the persisted
 * FinancialAssessment row, so the figures an officer reviews are exactly the
 * figures that get cleared and forwarded.
 */
import type { ParcelClassification } from "@prisma/client";
import { computeStatutoryCompensation } from "./compensationCalc.js";
import { LAND_RULES_VERSION, hashToUnit, landRuleFor } from "./landRules.js";

export const ACRES_PER_HECTARE = 2.47105;

export interface FinanceParcelInput {
  id: string;
  ulpin: string;
  khasraNo: string;
  areaHa: number;
  classification: ParcelClassification;
  ownerName: string;
  coOwners: number;
  provenance?: string;
}

export interface FinanceProposalInput {
  id: string;
  state: string;
  district: string;
  initiatedAt: Date;
  parcels: FinanceParcelInput[];
}

export interface CompensationBeneficiary {
  parcelId: string;
  ulpin: string;
  surveyNo: string;
  ownerName: string;
  coOwners: number;
  classification: ParcelClassification;
  provenance: string;
  areaHa: number;
  areaAcres: number;
  /** State circle rate applied, ₹/Ha. */
  circleRatePerHa: number;
  /** Highest of the three statutory market-value sources, ₹/Ha. */
  marketValuePerHa: number;
  /** First Schedule multiplier applied to the land value. */
  multiplier: number;
  /** Top-half sale-deed average used as the selected market value, ₹/Ha. */
  avgTopHalfSaleDeedsPerHa: number;
  /** Comparable-area average, ₹/Ha. */
  comparableAreaAvgPerHa: number;
  distanceFromUrbanKm: number;
  landValue: number;
  assetValue: number;
  solatium: number;
  interest: number;
  totalCompensation: number;
}

export interface FinanceAssessmentResult {
  proposalId: string;
  landRulesVersion: string;
  notificationDate: string;
  awardDate: string;
  beneficiaryCount: number;
  totalAreaHa: number;
  totals: {
    landValue: number;
    assetValue: number;
    solatium: number;
    interest: number;
    totalCompensation: number;
  };
  beneficiaries: CompensationBeneficiary[];
}

function assetItemsForParcel(parcel: FinanceParcelInput): {
  structures: number;
  trees: number;
  wells: number;
  crops: number;
} {
  const seed = `${parcel.ulpin}:assets`;
  const variance = 0.85 + hashToUnit(seed) * 0.3;
  const urban = parcel.classification === "URBAN";

  // Per-hectare asset norms; rural holdings carry more crop/tree value, urban
  // parcels more built-structure value. Deliberately simple, deterministic
  // heuristics in place of a field asset survey.
  const structures = parcel.areaHa * (urban ? 26_000 : 9_000) * variance;
  const trees = parcel.areaHa * (urban ? 6_000 : 16_000) * (0.9 + hashToUnit(seed + ":t") * 0.2);
  const wells = Math.round(parcel.areaHa / 2) * (urban ? 60_000 : 1_40_000);
  const crops = urban ? 0 : parcel.areaHa * 11_000 * (0.9 + hashToUnit(seed + ":c") * 0.2);

  return {
    structures: Math.round(structures),
    trees: Math.round(trees),
    wells: Math.round(wells),
    crops: Math.round(crops),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Computes the full per-beneficiary compensation assessment for one proposal.
 * `awardDate` defaults to now — the date the Finance Officer runs the engine.
 */
export function computeFinanceAssessment(
  proposal: FinanceProposalInput,
  awardDate: Date = new Date(),
): FinanceAssessmentResult {
  const rule = landRuleFor(proposal.state);
  const notificationDate = proposal.initiatedAt.toISOString();

  const beneficiaries: CompensationBeneficiary[] = proposal.parcels.map((parcel) => {
    const isUrban = parcel.classification === "URBAN";
    const baseRate = isUrban ? rule.urbanCircleRatePerHa : rule.ruralCircleRatePerHa;

    // Deterministic ±6% locality variation around the state reference rate.
    const localityFactor = 0.94 + hashToUnit(`${parcel.ulpin}:rate`) * 0.12;
    const circleRatePerHa = Math.round(baseRate * localityFactor);
    const avgTopHalfSaleDeedsPerHa = Math.round(circleRatePerHa * 1.06);
    const comparableAreaAvgPerHa = Math.round(circleRatePerHa * 0.97);

    // Rural parcels sit a hash-varied distance from the urban centre; urban
    // parcels take the flat 1.0 multiplier.
    const distanceFromUrbanKm = isUrban
      ? 0
      : Number(
          (
            rule.ruralDistanceFromUrbanKm *
            (0.6 + hashToUnit(`${parcel.ulpin}:dist`) * 0.8)
          ).toFixed(1),
        );

    const assetItems = assetItemsForParcel(parcel);

    const calc = computeStatutoryCompensation({
      circleRate: circleRatePerHa * parcel.areaHa,
      avgTopHalfSaleDeeds: avgTopHalfSaleDeedsPerHa * parcel.areaHa,
      comparableAreaAvg: comparableAreaAvgPerHa * parcel.areaHa,
      distanceFromUrbanKm,
      assetItems,
      notificationDate,
      awardDate: awardDate.toISOString(),
    });

    const marketValuePerHa = parcel.areaHa > 0 ? Math.round(calc.marketValue / parcel.areaHa) : 0;

    return {
      parcelId: parcel.id,
      ulpin: parcel.ulpin,
      surveyNo: parcel.khasraNo,
      ownerName: parcel.ownerName,
      coOwners: parcel.coOwners,
      classification: parcel.classification,
      provenance: parcel.provenance ?? "LEGACY_MIGRATED",
      areaHa: round2(parcel.areaHa),
      areaAcres: round2(parcel.areaHa * ACRES_PER_HECTARE),
      circleRatePerHa,
      marketValuePerHa,
      multiplier: calc.ruralMultiplier,
      avgTopHalfSaleDeedsPerHa,
      comparableAreaAvgPerHa,
      distanceFromUrbanKm,
      landValue: Math.round(calc.marketValue * calc.ruralMultiplier),
      assetValue: Math.round(calc.assetValue),
      solatium: Math.round(calc.solatium),
      interest: Math.round(calc.interestAmount),
      totalCompensation: Math.round(calc.totalCompensation),
    } satisfies CompensationBeneficiary;
  });

  const totals = beneficiaries.reduce(
    (acc, b) => {
      acc.landValue += b.landValue;
      acc.assetValue += b.assetValue;
      acc.solatium += b.solatium;
      acc.interest += b.interest;
      acc.totalCompensation += b.totalCompensation;
      return acc;
    },
    { landValue: 0, assetValue: 0, solatium: 0, interest: 0, totalCompensation: 0 },
  );

  return {
    proposalId: proposal.id,
    landRulesVersion: LAND_RULES_VERSION,
    notificationDate,
    awardDate: awardDate.toISOString(),
    beneficiaryCount: beneficiaries.length,
    totalAreaHa: round2(proposal.parcels.reduce((s, p) => s + p.areaHa, 0)),
    totals: {
      landValue: Math.round(totals.landValue),
      assetValue: Math.round(totals.assetValue),
      solatium: Math.round(totals.solatium),
      interest: Math.round(totals.interest),
      totalCompensation: Math.round(totals.totalCompensation),
    },
    beneficiaries,
  };
}

/** Stage from which a proposal counts as LAO-approved and finance-actionable. */
export const LAO_APPROVED_STAGES = ["SEC_19", "AWARD", "RR_COMPLETE"] as const;
export type LaoApprovedStage = (typeof LAO_APPROVED_STAGES)[number];

export function isLaoApprovedStage(stage: string): stage is LaoApprovedStage {
  return (LAO_APPROVED_STAGES as readonly string[]).includes(stage);
}

const STATE_CODE_FOR_REFERENCE: Record<string, string> = {
  Maharashtra: "MH",
  "Tamil Nadu": "TN",
  Assam: "AS",
  Goa: "GA",
  Punjab: "PB",
  Karnataka: "KA",
  Kerala: "KL",
  Haryana: "HR",
  Gujarat: "GJ",
  "Uttar Pradesh": "UP",
};

/** Financial clearance number, e.g. FIN/KA/2026/PROP-0104. */
export function financialReferenceNumber(proposal: {
  id: string;
  state: string;
  financialYear?: number;
}): string {
  const code = STATE_CODE_FOR_REFERENCE[proposal.state] ?? "IN";
  const year = proposal.financialYear ?? new Date().getFullYear();
  return `FIN/${code}/${year}/${proposal.id}`;
}
