import type { BaseStateAdapter } from "./stateAdapter.js";
import westBengalAdapter from "./westBengalAdapter.js";
import { GenericMockAdapter } from "./genericMockAdapter.js";

/**
 * The remaining 35 states/UTs (all but West Bengal, which has the dedicated
 * WestBengalAdapter reference implementation above). Each entry is a
 * generic demo adapter — plausible portal name, district and local
 * terminology, but not a real connection to that state's actual land-records
 * system. Mirrors src/data/mockData.ts's STATE_CODE list.
 */
const OTHER_STATES: {
  code: string;
  name: string;
  district: string;
  villageTerm: string;
  plotTerm: string;
}[] = [
  { code: "MH", name: "Maharashtra (Mahabhulekh Integration)", district: "Pune", villageTerm: "Mouje", plotTerm: "Gat No." },
  { code: "TN", name: "Tamil Nadu (Patta Chitta / TNREGINET Integration)", district: "Kancheepuram", villageTerm: "Village", plotTerm: "Survey No." },
  { code: "AS", name: "Assam (Dharitree Integration)", district: "Kamrup", villageTerm: "Mouza", plotTerm: "Dag No." },
  { code: "GA", name: "Goa (Goa Land Records Integration)", district: "North Goa", villageTerm: "Village", plotTerm: "Survey No." },
  { code: "PB", name: "Punjab (PLRS Fard Integration)", district: "Ludhiana", villageTerm: "Village", plotTerm: "Khasra No." },
  { code: "AP", name: "Andhra Pradesh (Meebhoomi Integration)", district: "Guntur", villageTerm: "Village", plotTerm: "Survey No." },
  { code: "AR", name: "Arunachal Pradesh (Land Records Portal)", district: "Papum Pare", villageTerm: "Circle", plotTerm: "LPC No." },
  { code: "BR", name: "Bihar (Bihar Bhumi Integration)", district: "Patna", villageTerm: "Village", plotTerm: "Khesra No." },
  { code: "CG", name: "Chhattisgarh (Bhuiyan Integration)", district: "Raipur", villageTerm: "Village", plotTerm: "Khasra No." },
  { code: "GJ", name: "Gujarat (AnyROR Integration)", district: "Ahmedabad", villageTerm: "Village", plotTerm: "Survey No." },
  { code: "HR", name: "Haryana (Jamabandi.nic.in Integration)", district: "Gurugram", villageTerm: "Village", plotTerm: "Khasra No." },
  { code: "HP", name: "Himachal Pradesh (HimBhoomi Integration)", district: "Shimla", villageTerm: "Village", plotTerm: "Khasra No." },
  { code: "JH", name: "Jharkhand (Jharbhoomi Integration)", district: "Ranchi", villageTerm: "Village", plotTerm: "Khatian No." },
  { code: "KA", name: "Karnataka (Bhoomi Integration)", district: "Bengaluru Urban", villageTerm: "Village", plotTerm: "Survey No." },
  { code: "KL", name: "Kerala (ReLIS Integration)", district: "Ernakulam", villageTerm: "Village", plotTerm: "Survey No." },
  { code: "MP", name: "Madhya Pradesh (MP Bhulekh Integration)", district: "Bhopal", villageTerm: "Village", plotTerm: "Khasra No." },
  { code: "MN", name: "Manipur (Land Records Portal)", district: "Imphal West", villageTerm: "Village", plotTerm: "Patta No." },
  { code: "ML", name: "Meghalaya (Land Records Portal)", district: "East Khasi Hills", villageTerm: "Village", plotTerm: "LPC No." },
  { code: "MZ", name: "Mizoram (Land Records Portal)", district: "Aizawl", villageTerm: "Village", plotTerm: "LSC No." },
  { code: "NL", name: "Nagaland (Land Records Portal)", district: "Kohima", villageTerm: "Village", plotTerm: "Plot No." },
  { code: "OD", name: "Odisha (Bhulekh Odisha Integration)", district: "Khordha", villageTerm: "Village", plotTerm: "Plot No." },
  { code: "RJ", name: "Rajasthan (Apna Khata Integration)", district: "Jaipur", villageTerm: "Village", plotTerm: "Khasra No." },
  { code: "SK", name: "Sikkim (Land Records Portal)", district: "East Sikkim", villageTerm: "Village", plotTerm: "Parcha No." },
  { code: "TS", name: "Telangana (Dharani Integration)", district: "Rangareddy", villageTerm: "Village", plotTerm: "Survey No." },
  { code: "TR", name: "Tripura (Land Records Portal)", district: "West Tripura", villageTerm: "Mouza", plotTerm: "Dag No." },
  { code: "UP", name: "Uttar Pradesh (Bhulekh UP Integration)", district: "Lucknow", villageTerm: "Village", plotTerm: "Khasra No." },
  { code: "UK", name: "Uttarakhand (Devbhoomi Bhulekh Integration)", district: "Dehradun", villageTerm: "Village", plotTerm: "Khasra No." },
  { code: "AN", name: "Andaman and Nicobar Islands (Land Records Portal)", district: "South Andaman", villageTerm: "Village", plotTerm: "Plot No." },
  { code: "CH", name: "Chandigarh (Land Records Portal)", district: "Chandigarh", villageTerm: "Village", plotTerm: "Khasra No." },
  { code: "DN", name: "Dadra and Nagar Haveli and Daman and Diu (Land Records Portal)", district: "Daman", villageTerm: "Village", plotTerm: "Survey No." },
  { code: "DL", name: "Delhi (Delhi Bhulekh Integration)", district: "South Delhi", villageTerm: "Village", plotTerm: "Khasra No." },
  { code: "JK", name: "Jammu and Kashmir (Land Records Portal)", district: "Srinagar", villageTerm: "Village", plotTerm: "Khewat No." },
  { code: "LA", name: "Ladakh (Land Records Portal)", district: "Leh", villageTerm: "Village", plotTerm: "Khewat No." },
  { code: "LD", name: "Lakshadweep (Land Records Portal)", district: "Lakshadweep", villageTerm: "Island", plotTerm: "Reg. No." },
  { code: "PY", name: "Puducherry (Land Records Portal)", district: "Puducherry", villageTerm: "Village", plotTerm: "Chitta No." },
];

class AdapterRegistry {
  private readonly adapters = new Map<string, BaseStateAdapter>();

  constructor() {
    this.register(westBengalAdapter);
    for (const s of OTHER_STATES) {
      this.register(new GenericMockAdapter(s.code, s.name, s.district, s.villageTerm, s.plotTerm));
    }
  }

  register(adapter: BaseStateAdapter): void {
    this.adapters.set(adapter.stateCode, adapter);
  }

  get(stateCode: string): BaseStateAdapter | null {
    return this.adapters.get(stateCode) ?? null;
  }

  list() {
    return Array.from(this.adapters.values()).map((adapter) => ({
      stateCode: adapter.stateCode,
      stateName: adapter.stateName,
      isRegistered: true,
    }));
  }
}

export const adapterRegistry = new AdapterRegistry();
