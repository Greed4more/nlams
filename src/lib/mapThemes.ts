export type MapThemeId = "nlams" | "tn" | "wb";

export interface MapTheme {
  id: MapThemeId;
  label: string;
  portalTitle: string;
  portalSubtitle: string;
  /** Header strip background inside the map panel. */
  accent: string;
  accentForeground: string;
  /** Cadastral parcel outline color. */
  parcelStroke: string;
  /** Permanent survey-number label color. */
  labelColor: string;
}

/**
 * Visual skins for the cadastral map. "tn" is styled after a screenshot of
 * Tamil Nadu's TNGIS Nilam viewer the user shared. "wb" is a best-effort
 * approximation of West Bengal's Banglarbhumi land-records portal — no
 * reference screenshot was available for that one, so it's a plausible
 * govt-portal look (deep green, blue cadastral lines), not a pixel clone.
 * Neither reproduces the real portals' logos/emblems — these are demo skins
 * inside NLAMS, not the actual government sites.
 */
export const MAP_THEMES: Record<MapThemeId, MapTheme> = {
  nlams: {
    id: "nlams",
    label: "NLAMS Standard",
    portalTitle: "NLAMS Cadastral Viewer",
    portalSubtitle: "National Land Acquisition & Management System",
    accent: "#0f2942",
    accentForeground: "#ffffff",
    parcelStroke: "#0f2942",
    labelColor: "#0f2942",
  },
  tn: {
    id: "tn",
    label: "Tamil Nilam style",
    portalTitle: "Tamil Nilam — GI Viewer",
    portalSubtitle: "Demo skin styled after Tamil Nadu's GI Viewer — not the government site",
    accent: "#1d4e6b",
    accentForeground: "#ffffff",
    parcelStroke: "#ec0c8c",
    labelColor: "#ff4d1a",
  },
  wb: {
    id: "wb",
    label: "Banglarbhumi style",
    portalTitle: "Banglarbhumi — GI Viewer",
    portalSubtitle: "Approximate demo skin (no reference screenshot) — not the government site",
    accent: "#0b5d34",
    accentForeground: "#ffffff",
    parcelStroke: "#1c6dd0",
    labelColor: "#c77800",
  },
};

export const MAP_THEME_LIST = Object.values(MAP_THEMES);

/** Highlight color for the currently selected parcel, independent of theme. */
export const SELECTED_PARCEL_COLOR = "#00c2d1";

/**
 * Admin-boundary hierarchy colors — fixed across all portal themes (like the
 * real TNGIS Nilam viewer's red district / magenta block lines), independent
 * of the cadastral parcel theme above.
 */
export const ADMIN_BOUNDARY_COLORS = {
  district: "#c0392b",
  block: "#ec0c8c",
} as const;

const STATE_LULC_LAYER: Record<string, string> = {
  Maharashtra: "basemap:MH_LULC",
  "Tamil Nadu": "basemap:TN_LULC",
  Assam: "basemap:AS_LULC",
  Goa: "basemap:GA_LULC",
  Punjab: "basemap:PB_LULC",
};

/** ISRO Bhuvan's per-state Land Use / Land Cover WMS layer, if we have one. */
export function lulcLayerFor(state: string | null): string | null {
  return state ? (STATE_LULC_LAYER[state] ?? null) : null;
}
