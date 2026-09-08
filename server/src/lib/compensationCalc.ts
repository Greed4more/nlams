/**
 * Statutory compensation award calculation, Sec. 26-30 RFCTLARR Act 2013 —
 * ported from Bhumitra's compensation.controller.js. This is the persisted,
 * audited award computation for a specific parcel (multi-source market value,
 * stepped rural-multiplier bands). It's deliberately separate from
 * src/lib/compensation.ts on the frontend, which is an interactive What-If
 * estimator with its own linear distance factor — this one is the version of
 * record once an officer finalizes a parcel's award.
 */
export interface CompensationCalcInput {
  circleRate?: number;
  avgTopHalfSaleDeeds?: number;
  comparableAreaAvg?: number;
  distanceFromUrbanKm?: number;
  ruralMultiplierOverride?: number | null;
  assetItems?: { structures?: number; trees?: number; wells?: number; crops?: number };
  notificationDate: string;
  awardDate: string;
}

export interface CompensationCalcResult {
  marketValue: number;
  ruralMultiplier: number;
  assetValue: number;
  solatium: number;
  interestAmount: number;
  totalCompensation: number;
  breakdown: Record<string, unknown>;
}

function ruralMultiplierForDistance(distanceKm: number): number {
  if (distanceKm <= 10) return 1.0;
  if (distanceKm <= 20) return 1.25;
  if (distanceKm <= 30) return 1.5;
  if (distanceKm <= 50) return 1.75;
  return 2.0;
}

export function computeStatutoryCompensation(input: CompensationCalcInput): CompensationCalcResult {
  const circleRate = Number(input.circleRate) || 0;
  const avgTopHalfSaleDeeds = Number(input.avgTopHalfSaleDeeds) || 0;
  const comparableAreaAvg = Number(input.comparableAreaAvg) || 0;
  const marketValue = Math.max(circleRate, avgTopHalfSaleDeeds, comparableAreaAvg);
  if (marketValue <= 0) {
    throw new Error("Market value must be greater than zero — provide circleRate or a sale-deed average.");
  }

  const distanceFromUrbanKm = Number(input.distanceFromUrbanKm) || 0;
  const ruralMultiplier =
    input.ruralMultiplierOverride != null
      ? Number(input.ruralMultiplierOverride)
      : ruralMultiplierForDistance(distanceFromUrbanKm);

  const marketValueMultiplied = marketValue * ruralMultiplier;

  const structures = Number(input.assetItems?.structures) || 0;
  const trees = Number(input.assetItems?.trees) || 0;
  const wells = Number(input.assetItems?.wells) || 0;
  const crops = Number(input.assetItems?.crops) || 0;
  const assetValue = structures + trees + wells + crops;

  const baseCompensation = marketValueMultiplied + assetValue;

  // Solatium = 100% of base, excluding interest — RB Dealers Pvt Ltd v.
  // Metro Railway Kolkata (2019) SC precedent.
  const solatium = baseCompensation;

  const notifDate = new Date(input.notificationDate);
  const awdDate = new Date(input.awardDate);
  const durationDays = Math.max(0, (awdDate.getTime() - notifDate.getTime()) / 86_400_000);
  const durationYears = durationDays / 365.25;
  const interestAmount = 0.12 * marketValue * durationYears;

  const totalCompensation = baseCompensation + solatium + interestAmount;

  return {
    marketValue,
    ruralMultiplier,
    assetValue,
    solatium,
    interestAmount,
    totalCompensation,
    breakdown: {
      statutoryAct: "RFCTLARR Act 2013 (First Schedule & Supreme Court precedents)",
      supremeCourtPrecedent: "RB Dealers Pvt Ltd v. Metro Railway Kolkata (2019) — solatium on base only",
      step1MarketValue: { circleRate, avgTopHalfSaleDeeds, comparableAreaAvg, selected: marketValue },
      step2RuralMultiplier: { distanceFromUrbanKm, applied: ruralMultiplier, multipliedLandValue: marketValueMultiplied },
      step3AssetValuation: { structures, trees, wells, crops, total: assetValue },
      baseLandPlusAssets: baseCompensation,
      step4Solatium: solatium,
      step5Interest: {
        notificationDate: input.notificationDate,
        awardDate: input.awardDate,
        durationDays: Math.round(durationDays),
        annualRate: "12%",
        interestAmount,
      },
      step6Total: totalCompensation,
    },
  };
}
