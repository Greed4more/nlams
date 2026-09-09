/**
 * Approximate real-world [lat, lng] centroids for each district's HQ town —
 * used only to place seeded demo parcels somewhere geographically plausible.
 * These are NOT real cadastral survey coordinates; real ULPIN parcel
 * geometry would come from the state Revenue Department's cadastral maps.
 */
export const DISTRICT_COORDS: Record<string, [number, number]> = {
  Palghar: [19.697, 72.765],
  Thane: [19.2183, 72.9781],
  Raigarh: [18.6414, 72.8722],
  Nashik: [19.9975, 73.7898],
  Pune: [18.5204, 73.8567],
  Nagpur: [21.1458, 79.0882],

  Kancheepuram: [12.8342, 79.7036],
  Coimbatore: [11.0168, 76.9558],
  Thiruvallur: [13.1231, 79.912],
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

  // West Bengal — polygon centroids computed from public/geo/districts/WB.geojson
  // (geoBoundaries.org / lgdirectory.gov.in), not hand-picked HQ towns like the rest of this
  // file, so district names must match that file's `distName` values exactly.
  Kolkata: [22.5601, 88.3542],
  Haora: [22.5652, 88.0709],
  Hugli: [22.8957, 88.0058],
  "North Twenty Four Parganas": [22.7559, 88.7661],
  "South Twenty Four Parganas": [22.1163, 88.6175],
  "Paschim Medinipur": [22.3524, 87.4276],

  // Remaining 30 states/UTs — approximate district-HQ centroids, same caveat
  // as above (demo placement only, not surveyed cadastral geometry).
  Visakhapatnam: [17.6868, 83.2185],
  Krishna: [16.5062, 80.648],
  Guntur: [16.3067, 80.4365],

  "Papum Pare": [27.0844, 93.6053],
  "East Siang": [28.0667, 95.3167],
  "West Kameng": [27.2645, 92.4159],

  Patna: [25.5941, 85.1376],
  Muzaffarpur: [26.1225, 85.3906],
  Gaya: [24.7955, 84.9994],

  Raipur: [21.2514, 81.6296],
  Bilaspur: [22.0797, 82.1409],
  Durg: [21.1904, 81.2849],

  Ahmadabad: [23.0225, 72.5714],
  Surat: [21.1702, 72.8311],
  Vadodara: [22.3072, 73.1812],

  Gurgaon: [28.4595, 77.0266],
  Faridabad: [28.4089, 77.3178],
  Panipat: [29.3909, 76.9635],

  Shimla: [31.1048, 77.1734],
  Kangra: [32.0998, 76.2691],
  Mandi: [31.708, 76.9318],

  Ranchi: [23.3441, 85.3096],
  Dhanbad: [23.7957, 86.4304],
  "Purbi Singhbhum": [22.8046, 86.2029],

  Bangalore: [12.9716, 77.5946],
  Mysore: [12.2958, 76.6394],
  Belgaum: [15.8497, 74.4977],

  Ernakulam: [9.9816, 76.2999],
  Thiruvananthapuram: [8.5241, 76.9366],
  Kozhikode: [11.2588, 75.7804],

  Indore: [22.7196, 75.8577],
  Bhopal: [23.2599, 77.4126],
  Jabalpur: [23.1815, 79.9864],

  "Imphal West": [24.817, 93.9368],
  "Imphal East": [24.8074, 93.9987],

  "East Khasi Hills": [25.5788, 91.8933],
  "West Garo Hills": [25.5148, 90.2201],

  Aizawl: [23.7271, 92.7176],
  Lunglei: [22.8879, 92.732],

  Kohima: [25.6751, 94.1086],
  Wokha: [26.0989, 94.2606],

  Khordha: [20.183, 85.6174],
  Cuttack: [20.4625, 85.8828],
  Ganjam: [19.3149, 84.7941],

  Jaipur: [26.9124, 75.7873],
  Jodhpur: [26.2389, 73.0243],
  Udaipur: [24.5854, 73.7125],

  "East District": [27.3389, 88.6065],
  "South District": [27.1667, 88.3667],

  Hydrabad: [17.385, 78.4867],
  Rangareddy: [17.3, 78.3],
  "Warangal (U)": [17.9689, 79.5941],

  "West Tripura": [23.8315, 91.2868],
  Gomati: [23.5333, 91.4833],

  Lucknow: [26.8467, 80.9462],
  "Kanpur Nagar": [26.4499, 80.3319],
  Ghaziabad: [28.6692, 77.4538],

  Dehradun: [30.3165, 78.0322],
  Hardwar: [29.9457, 78.1642],
  Nainital: [29.3803, 79.4636],

  "South Andaman": [11.6234, 92.7265],
  "North  & Middle Andaman": [12.9333, 92.9],

  Chandigarh: [30.7333, 76.7794],

  Diu: [20.7144, 70.9876],
  Daman: [20.3974, 72.8328],

  "New Delhi": [28.6139, 77.209],
  South: [28.5245, 77.1855],
  "North West": [28.7185, 77.12],

  Srinagar: [34.0837, 74.7973],
  Jammu: [32.7266, 74.857],

  "Leh(Ladakh)": [34.1526, 77.5771],
  Kargil: [34.5539, 76.1349],

  Lakshadweep: [10.5669, 72.642],

  Puducherry: [11.9416, 79.8083],
  Karaikal: [10.9254, 79.838],
};
