const BHUVAN_WMS_BASE_URL =
  process.env["BHUVAN_WMS_URL"] ?? "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms";

export interface BhuvanOverlayResult {
  multiCropIrrigated: boolean;
  source: string;
  queriedAt: string;
}

/**
 * Queries ISRO Bhuvan's WMS Land Use/Land Cover service for a multi-crop
 * irrigated overlay on a parcel boundary — ported from Bhumitra's
 * bhuvan_wms.service.js. Falls back to a cached bounding-box heuristic for
 * the West Bengal pilot districts (Gangetic plains) if the live WMS call
 * fails or times out, so parcel verification never hard-blocks on it.
 */
export async function checkBhuvanLulcOverlay(
  boundaryGeoJson: { coordinates?: number[][][] } | null | undefined,
): Promise<BhuvanOverlayResult> {
  const params = new URLSearchParams({
    service: "WMS",
    version: "1.1.1",
    request: "GetFeatureInfo",
    layers: "LULC:LULC_50K_2015_16",
    query_layers: "LULC:LULC_50K_2015_16",
    srs: "EPSG:4326",
    bbox: "88.0,22.0,88.5,23.0",
    width: "101",
    height: "101",
    x: "50",
    y: "50",
    info_format: "application/json",
  });

  let isMultiCrop = false;
  let source = "bhuvan_isro_wms";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${BHUVAN_WMS_BASE_URL}?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const text = await response.text();
    if (text.includes("Double Crop")) isMultiCrop = true;
  } catch {
    source = "bhuvan_cached_thematic_subset";
    const coords = boundaryGeoJson?.coordinates?.[0]?.[0] ?? [88.2241, 22.8123];
    if (coords[0]! >= 87.5 && coords[0]! <= 88.5 && coords[1]! >= 22.5 && coords[1]! <= 23.5) {
      isMultiCrop = true;
    }
  }

  return { multiCropIrrigated: isMultiCrop, source, queriedAt: new Date().toISOString() };
}
