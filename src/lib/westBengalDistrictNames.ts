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
