/**
 * public/geo/west-bengal-districts.geojson uses LGD (lgdirectory.gov.in) /
 * geoBoundaries transliterations for `distName`, which differ from the
 * commonly used English spellings for several districts (e.g. "Haora" vs
 * "Howrah"). This maps the source spelling to a display label — keep the
 * source spelling everywhere the geojson/DB is matched against by string
 * equality (Proposal.district, block layer's districtName), and only swap
 * in the display label at render time.
 */
export const WB_DISTRICT_DISPLAY_NAME: Record<string, string> = {
  Barddhaman: "Purba Bardhaman",
  "Paschim Barddhaman": "Paschim Bardhaman",
  Hugli: "Hooghly",
  Haora: "Howrah",
  "Koch Bihar": "Cooch Behar",
  Maldah: "Malda",
  Darjiling: "Darjeeling",
  Puruliya: "Purulia",
  "North Twenty Four Parganas": "North 24 Parganas",
  "South Twenty Four Parganas": "South 24 Parganas",
};

export function wbDistrictDisplayName(distName: string): string {
  return WB_DISTRICT_DISPLAY_NAME[distName] ?? distName;
}

/**
 * Same LGD-transliteration quirk applies to every state's district file
 * (they share the geoBoundaries/LGD source), but only West Bengal's spelling
 * differences have been curated into a display-name table so far. Falls
 * back to the raw LGD name for every other state.
 */
export function districtDisplayName(distName: string, stateCode: string): string {
  return stateCode === "WB" ? wbDistrictDisplayName(distName) : distName;
}
