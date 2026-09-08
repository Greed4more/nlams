/**
 * Mock Central ULPIN (Unique Land Parcel Identification Number / Bhu-Aadhaar)
 * Registry lookup — ported from Bhumitra's ulpin_lookup.service.js. Live
 * government access to the real registry requires a state MoU, so this
 * stub is shaped against the Ministry of Rural Development's 14-character
 * alphanumeric ULPIN spec for demo purposes.
 */
export interface UlpinLookupResult {
  found: boolean;
  source: "central_ulpin_registry_stub";
  message?: string;
  data?: {
    ulpinId: string;
    state: string;
    district: string;
    villageMouza: string;
    khasraNo: string;
    provenance: "ULPIN_VERIFIED";
    areaHa: number;
  };
}

export async function lookupUlpinRegistry(identifier: string): Promise<UlpinLookupResult> {
  const trimmed = identifier.trim();
  const isUlpinFormat = /^[A-Za-z0-9]{14}$/.test(trimmed);

  if (!isUlpinFormat && !trimmed.includes("/")) {
    return {
      found: false,
      source: "central_ulpin_registry_stub",
      message: "Identifier is not a valid 14-character ULPIN or Khasra/Plot key.",
    };
  }

  if (trimmed === "19102488102931" || trimmed === "19102488102932" || trimmed.includes("412")) {
    return {
      found: true,
      source: "central_ulpin_registry_stub",
      data: {
        ulpinId: trimmed.length === 14 ? trimmed : "19102488102931",
        state: "West Bengal",
        district: "Hooghly",
        villageMouza: "Singur Mouza JL 12",
        khasraNo: "Khatian 412 / Plot 890",
        provenance: "ULPIN_VERIFIED",
        areaHa: 2.45,
      },
    };
  }

  return { found: false, source: "central_ulpin_registry_stub", message: "ULPIN record not found in central registry." };
}
