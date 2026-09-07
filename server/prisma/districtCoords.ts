/**
 * Approximate real-world [lat, lng] centroids for each district's HQ town —
 * used only to place seeded demo parcels somewhere geographically plausible.
 * These are NOT real cadastral survey coordinates; real ULPIN parcel
 * geometry would come from the state Revenue Department's cadastral maps.
 */
export const DISTRICT_COORDS: Record<string, [number, number]> = {
  Palghar: [19.697, 72.765],
  Thane: [19.2183, 72.9781],
  Raigad: [18.6414, 72.8722],
  Nashik: [19.9975, 73.7898],
  Pune: [18.5204, 73.8567],
  Nagpur: [21.1458, 79.0882],

  Kancheepuram: [12.8342, 79.7036],
  Coimbatore: [11.0168, 76.9558],
  Tiruvallur: [13.1231, 79.912],
  Madurai: [9.9252, 78.1198],
  Salem: [11.6643, 78.146],

  Kamrup: [26.1445, 91.7362],
  Dibrugarh: [27.4728, 94.912],
  Nagaon: [26.348, 92.684],
  Sonitpur: [26.6338, 92.8],
  Barpeta: [26.322, 91.009],

  "South Goa": [15.2735, 73.9581],
  "North Goa": [15.4909, 73.8278],

  Ludhiana: [30.901, 75.8573],
  Patiala: [30.3398, 76.3869],
  Bathinda: [30.211, 74.9455],
  Jalandhar: [31.326, 75.5762],
  Amritsar: [31.634, 74.8723],

  // West Bengal — polygon centroids computed from public/geo/west-bengal-districts.geojson
  // (geoBoundaries.org / lgdirectory.gov.in), not hand-picked HQ towns like the rest of this
  // file, so district names must match that file's `distName` values exactly.
  Kolkata: [22.5601, 88.3542],
  Haora: [22.5652, 88.0709],
  Hugli: [22.8957, 88.0058],
  "North Twenty Four Parganas": [22.7559, 88.7661],
  "South Twenty Four Parganas": [22.1163, 88.6175],
  "Paschim Medinipur": [22.3524, 87.4276],
};
