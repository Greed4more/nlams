import { BaseStateAdapter, type CanonicalParcel } from "./stateAdapter.js";

/**
 * Demo adapter for states without a dedicated reference implementation like
 * WestBengalAdapter. Mirrors its shape (deterministic canned response) so
 * every state in the registry behaves consistently in the demo — this is
 * NOT a real connection to that state's actual land-records portal.
 */
export class GenericMockAdapter extends BaseStateAdapter {
  constructor(
    stateCode: string,
    stateName: string,
    private readonly district: string,
    private readonly villageTerm: string,
    private readonly plotTerm: string,
  ) {
    super(stateCode, stateName);
  }

  async fetchParcel(plotId: string) {
    if (plotId.trim().length > 0) {
      return {
        success: true,
        village: `${this.villageTerm} No. 4`,
        plotNumber: plotId,
        classification: "Agricultural",
        landAreaAcre: "0.75",
      };
    }
    return { success: false, message: `Record not found in ${this.stateName} portal.` };
  }

  mapToCanonical(rawData: Record<string, unknown>): CanonicalParcel {
    const classification = String(rawData["classification"] ?? "");
    return {
      state: this.stateName.replace(/\s*\(.*\)$/, ""),
      district: this.district,
      villageMouza: String(rawData["village"] ?? this.villageTerm),
      khasraNo: `${this.plotTerm} ${String(rawData["plotNumber"] ?? "")}`,
      provenance: "SVAMITVA_DIGITISED",
      restrictionFlags: classification.includes("Agricultural") ? ["multi_crop_irrigated"] : [],
    };
  }
}
