import { BaseStateAdapter, type CanonicalParcel } from "./stateAdapter.js";

/** West Bengal (Banglarbhumi) reference implementation — ported from Bhumitra. */
export class WestBengalAdapter extends BaseStateAdapter {
  constructor() {
    super("WB", "West Bengal (Banglarbhumi Integration)");
  }

  async fetchParcel(khatianPlotNo: string) {
    if (khatianPlotNo.includes("412") || khatianPlotNo.includes("890")) {
      return {
        success: true,
        wbMouzaName: "Singur Mouza",
        wbJlNumber: "12",
        wbKhatianNumber: "412",
        wbPlotNumber: "890",
        wbClassification: "Nal (Agricultural)",
        wbLandAreaAcre: "0.60",
      };
    }
    return { success: false, message: "Record not found in Banglarbhumi database." };
  }

  mapToCanonical(rawData: Record<string, unknown>): CanonicalParcel {
    const classification = String(rawData["wbClassification"] ?? "");
    return {
      state: "West Bengal",
      district: "Hooghly",
      villageMouza: `${rawData["wbMouzaName"]} JL ${rawData["wbJlNumber"]}`,
      khasraNo: `Khatian ${rawData["wbKhatianNumber"]} / Plot ${rawData["wbPlotNumber"]}`,
      provenance: "SVAMITVA_DIGITISED",
      restrictionFlags: classification.includes("Agricultural") ? ["multi_crop_irrigated"] : [],
    };
  }
}

export default new WestBengalAdapter();
