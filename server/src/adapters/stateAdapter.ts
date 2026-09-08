/**
 * Common pluggable interface for state land-records systems (36 States/UTs) —
 * ported from Bhumitra's state_adapter_interface.js. Each state onboards by
 * implementing this against its own portal (e.g. West Bengal's Banglarbhumi)
 * and registering with the adapter registry; no core code changes needed.
 */
export interface CanonicalParcel {
  state: string;
  district: string;
  villageMouza: string;
  khasraNo: string;
  provenance: "SVAMITVA_DIGITISED";
  restrictionFlags: string[];
}

export abstract class BaseStateAdapter {
  constructor(
    public readonly stateCode: string,
    public readonly stateName: string,
  ) {}

  /** Fetch a raw parcel record from the state portal API. */
  abstract fetchParcel(stateSpecificId: string): Promise<Record<string, unknown> & { success: boolean }>;

  /** Map the state-specific payload to the canonical Bhumitra/NLAMS parcel shape. */
  abstract mapToCanonical(rawData: Record<string, unknown>): CanonicalParcel;
}
