export type RfctlarrStage =
  "INTAKE" | "SIA" | "SIA_APPRAISAL" | "SEC_11" | "SEC_19" | "AWARD" | "RR_COMPLETE";

export type ParcelProvenance =
  "ULPIN_VERIFIED" | "SVAMITVA_DIGITISED" | "LEGACY_MIGRATED" | "SELF_DECLARED_PENDING";

export interface Parcel {
  id: string;
  ulpin: string;
  khasraNo: string;
  vernacularTerm: { local: string; script: string; standard: string };
  areaHa: number;
  classification: "RURAL" | "URBAN";
  ownerName: string;
  coOwners: number;
  compensationAssessed: number;
  compensationDisbursed: number;
  provenance: ParcelProvenance;
  restrictionFlags: string[];
}

export interface DocumentRef {
  id: string;
  name: string;
  type: "SIA_REPORT" | "SEC_11_NOTIFICATION" | "SEC_19_DECLARATION" | "AWARD_ORDER" | "RR_SCHEME";
  uploadedAt: string;
  sizeKb: number;
  sha256: string;
  verified: boolean;
  lastVerifiedAt: string | null;
}

export interface Proposal {
  id: string;
  projectName: string;
  requiringBody: string;
  state: string;
  district: string;
  currentStage: RfctlarrStage;
  stageEnteredAt: string;
  initiatedAt: string;
  totalAreaHa: number;
  affectedFamilies: number;
  parcels: Parcel[];
  documents: DocumentRef[];
  compensation: { assessed: number; disbursed: number; pending: number };
}

export const STAGE_LABELS: Record<RfctlarrStage, string> = {
  INTAKE: "Intake",
  SIA: "Social Impact Assessment",
  SIA_APPRAISAL: "SIA Appraisal (Expert Group)",
  SEC_11: "Sec. 11 Preliminary Notification",
  SEC_19: "Sec. 19 Declaration",
  AWARD: "Sec. 23 Award",
  RR_COMPLETE: "R&R Complete",
};

export const STAGE_ORDER: RfctlarrStage[] = [
  "INTAKE",
  "SIA",
  "SIA_APPRAISAL",
  "SEC_11",
  "SEC_19",
  "AWARD",
  "RR_COMPLETE",
];

/* ---------------------------------------------------------------- *
 * Glossary of Revenue Terms — vernacular normalisation layer
 * ---------------------------------------------------------------- */

export interface VernacularTerm {
  local: string;
  script: string;
  standard: string;
}

export const GLOSSARY: Record<string, VernacularTerm[]> = {
  Maharashtra: [
    { local: "Khasra", script: "खसरा", standard: "Plot Number" },
    { local: "Sat-Bara", script: "सातबारा", standard: "Record of Rights (7/12 Extract)" },
    { local: "Gat", script: "गट", standard: "Consolidated Survey Group" },
  ],
  Assam: [
    { local: "Dag", script: "দাগ", standard: "Plot Number" },
    { local: "Patta", script: "পট্টা", standard: "Title Deed" },
  ],
  "Tamil Nadu": [
    { local: "Survey Number", script: "சர்வே எண்", standard: "Survey Number" },
    { local: "Patta", script: "பட்டா", standard: "Title Deed" },
  ],
  Punjab: [
    { local: "Khasra", script: "ਖਸਰਾ", standard: "Plot Number" },
    { local: "Khatauni", script: "ਖਤੌਨੀ", standard: "Holding Register Entry" },
  ],
  Goa: [
    { local: "Survey No.", script: "Survey No.", standard: "Survey Number" },
    { local: "Chalta", script: "Chalta", standard: "City Survey Sub-division" },
  ],
  "West Bengal": [
    { local: "Dag", script: "দাগ", standard: "Plot Number" },
    { local: "Khatian", script: "খতিয়ান", standard: "Record of Rights" },
  ],
  "Andhra Pradesh": [
    { local: "Pahani", script: "పహాణీ", standard: "Record of Rights / Crop Inspection Register" },
    { local: "Adangal", script: "అడంగల్", standard: "Village Land Register" },
  ],
  "Arunachal Pradesh": [
    {
      local: "Land Possession Certificate",
      script: "LPC",
      standard: "Community Land Possession Certificate",
    },
  ],
  Bihar: [
    { local: "Khesra", script: "खेसरा", standard: "Plot Number" },
    { local: "Khatiyan", script: "खतियान", standard: "Record of Rights" },
  ],
  Chhattisgarh: [
    { local: "Khasra", script: "खसरा", standard: "Plot Number" },
    { local: "B-1 Khatauni", script: "बी-1 खतौनी", standard: "Holding Register Entry" },
  ],
  Gujarat: [
    { local: "Sat-Bar", script: "સાત-બાર", standard: "Record of Rights (7/12 Extract)" },
    { local: "Gam Namuna", script: "ગામ નમૂનો", standard: "Village Form Register" },
  ],
  Haryana: [
    { local: "Khasra", script: "खसरा", standard: "Plot Number" },
    { local: "Khatauni", script: "खतौनी", standard: "Holding Register Entry" },
  ],
  "Himachal Pradesh": [
    { local: "Khasra", script: "खसरा", standard: "Plot Number" },
    { local: "Jamabandi", script: "जमाबंदी", standard: "Record of Rights" },
  ],
  Jharkhand: [
    { local: "Khatian", script: "खतियान", standard: "Record of Rights" },
    { local: "Dag", script: "डैग", standard: "Plot Number" },
  ],
  Karnataka: [
    { local: "Pahani (RTC)", script: "ಪಹಣಿ", standard: "Record of Rights, Tenancy and Crops" },
    { local: "Sy. No.", script: "ಸರ್ವೆ ನಂ", standard: "Survey Number" },
  ],
  Kerala: [
    { local: "Thandaper", script: "തണ്ടപ്പേർ", standard: "Land Revenue Registry Account" },
    { local: "Pokkuvaravu", script: "പോക്കുവരവ്", standard: "Mutation Record" },
  ],
  "Madhya Pradesh": [
    { local: "Khasra", script: "खसरा", standard: "Plot Number" },
    { local: "B-1 Khatauni", script: "बी-1 खतौनी", standard: "Holding Register Entry" },
  ],
  Manipur: [
    { local: "Patta", script: "Patta", standard: "Title Deed" },
    { local: "Dag", script: "Dag", standard: "Plot Number" },
  ],
  // Meghalaya, Mizoram, Nagaland, Arunachal Pradesh: most land is held under
  // customary/community tenure (Sixth Schedule / Art. 371A), so there's no
  // Khasra-Khatauni system like the mainland states — these use the actual
  // certificate types those states issue instead.
  Meghalaya: [
    {
      local: "Land Possession Certificate",
      script: "LPC",
      standard: "Certificate of Customary Land Possession",
    },
  ],
  Mizoram: [
    { local: "LSC", script: "LSC", standard: "Land Settlement Certificate" },
    { local: "Periodic Patta", script: "Patta", standard: "Renewable Land Grant" },
  ],
  Nagaland: [
    {
      local: "Community Land Record",
      script: "—",
      standard: "Customary Land Ownership Record (Art. 371A)",
    },
  ],
  Odisha: [
    { local: "Khatian", script: "ଖତିୟାନ", standard: "Record of Rights" },
    { local: "Plot No.", script: "ପ୍ଲଟ ନମ୍ବର", standard: "Plot Number" },
  ],
  Rajasthan: [
    { local: "Khasra", script: "खसरा", standard: "Plot Number" },
    { local: "Jamabandi", script: "जमाबंदी", standard: "Record of Rights" },
  ],
  Sikkim: [{ local: "Parcha", script: "पर्चा", standard: "Land Title Certificate" }],
  Telangana: [
    { local: "Pahani", script: "పహాణీ", standard: "Record of Rights / Crop Inspection Register" },
    { local: "Dharani ROR 1B", script: "ధరణి", standard: "Digital Record of Rights" },
  ],
  Tripura: [
    { local: "Khatian", script: "খতিয়ান", standard: "Record of Rights" },
    { local: "Dag", script: "দাগ", standard: "Plot Number" },
  ],
  "Uttar Pradesh": [
    { local: "Khasra", script: "खसरा", standard: "Plot Number" },
    { local: "Khatauni", script: "खतौनी", standard: "Holding Register Entry" },
  ],
  Uttarakhand: [
    { local: "Khasra", script: "खसरा", standard: "Plot Number" },
    { local: "Khatauni", script: "खतौनी", standard: "Holding Register Entry" },
  ],
  "Andaman and Nicobar Islands": [
    { local: "Plot No.", script: "Plot No.", standard: "Land Allotment Number" },
  ],
  Chandigarh: [
    { local: "Khasra", script: "ਖਸਰਾ", standard: "Plot Number" },
    { local: "Khatauni", script: "ਖਤੌਨੀ", standard: "Holding Register Entry" },
  ],
  "Dadra and Nagar Haveli and Daman and Diu": [
    { local: "Survey No.", script: "Survey No.", standard: "Survey Number" },
  ],
  Delhi: [
    { local: "Khasra", script: "खसरा", standard: "Plot Number" },
    { local: "Khatauni", script: "खतौनी", standard: "Holding Register Entry" },
  ],
  "Jammu and Kashmir": [
    { local: "Khewat", script: "Khewat", standard: "Ownership Share Register" },
    { local: "Girdawari", script: "Girdawari", standard: "Periodic Crop Inspection Record" },
  ],
  Ladakh: [{ local: "Khewat", script: "Khewat", standard: "Ownership Share Register" }],
  Lakshadweep: [
    { local: "Land Registration No.", script: "—", standard: "Island Land Registration Number" },
  ],
  Puducherry: [
    { local: "Chitta", script: "சிட்டா", standard: "Land Revenue Account" },
    { local: "Adangal", script: "அடங்கல்", standard: "Village Land Register" },
  ],
};

/* ---------------------------------------------------------------- *
 * Deterministic PRNG so the dataset is stable across renders/SSR
 * ---------------------------------------------------------------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20130926); // RFCTLARR assent date as seed

const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const between = (min: number, max: number) => min + rand() * (max - min);
const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1));

const ALNUM = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";

const STATE_CODE: Record<string, string> = {
  Maharashtra: "MH",
  "Tamil Nadu": "TN",
  Assam: "AS",
  Goa: "GA",
  Punjab: "PB",
  "West Bengal": "WB",
  "Andhra Pradesh": "AP",
  "Arunachal Pradesh": "AR",
  Bihar: "BR",
  Chhattisgarh: "CG",
  Gujarat: "GJ",
  Haryana: "HR",
  "Himachal Pradesh": "HP",
  Jharkhand: "JH",
  Karnataka: "KA",
  Kerala: "KL",
  "Madhya Pradesh": "MP",
  Manipur: "MN",
  Meghalaya: "ML",
  Mizoram: "MZ",
  Nagaland: "NL",
  Odisha: "OD",
  Rajasthan: "RJ",
  Sikkim: "SK",
  Telangana: "TS",
  Tripura: "TR",
  "Uttar Pradesh": "UP",
  Uttarakhand: "UK",
  "Andaman and Nicobar Islands": "AN",
  Chandigarh: "CH",
  "Dadra and Nagar Haveli and Daman and Diu": "DN",
  Delhi: "DL",
  "Jammu and Kashmir": "JK",
  Ladakh: "LA",
  Lakshadweep: "LD",
  Puducherry: "PY",
};

/**
 * West Bengal district names use LGD/geoBoundaries transliterations (e.g.
 * "Haora", "Hugli") rather than common English spellings (Howrah, Hooghly)
 * so they match `distName` in public/geo/west-bengal-districts.geojson
 * exactly — see src/lib/westBengalDistrictNames.ts for display labels.
 */
const DISTRICTS: Record<string, string[]> = {
  Maharashtra: ["Palghar", "Thane", "Raigarh", "Nashik", "Pune", "Nagpur"],
  "Tamil Nadu": ["Kancheepuram", "Coimbatore", "Thiruvallur", "Madurai", "Salem"],
  Assam: ["Kamrup", "Dibrugarh", "Nagaon", "Sonitpur", "Barpeta"],
  Goa: ["South Goa", "North Goa"],
  Punjab: ["Ludhiana", "Patiala", "Bathinda", "Jalandhar", "Amritsar"],
  "West Bengal": [
    "Kolkata",
    "Haora",
    "Hugli",
    "North Twenty Four Parganas",
    "South Twenty Four Parganas",
    "Paschim Medinipur",
  ],
  "Andhra Pradesh": ["Visakhapatnam", "Krishna", "Guntur"],
  "Arunachal Pradesh": ["Papum Pare", "East Siang", "West Kameng"],
  Bihar: ["Patna", "Muzaffarpur", "Gaya"],
  Chhattisgarh: ["Raipur", "Bilaspur", "Durg"],
  Gujarat: ["Ahmadabad", "Surat", "Vadodara"],
  Haryana: ["Gurgaon", "Faridabad", "Panipat"],
  "Himachal Pradesh": ["Shimla", "Kangra", "Mandi"],
  Jharkhand: ["Ranchi", "Dhanbad", "Purbi Singhbhum"],
  Karnataka: ["Bangalore", "Mysore", "Belgaum"],
  Kerala: ["Ernakulam", "Thiruvananthapuram", "Kozhikode"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur"],
  Manipur: ["Imphal West", "Imphal East"],
  Meghalaya: ["East Khasi Hills", "West Garo Hills"],
  Mizoram: ["Aizawl", "Lunglei"],
  Nagaland: ["Kohima", "Wokha"],
  Odisha: ["Khordha", "Cuttack", "Ganjam"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur"],
  Sikkim: ["East District", "South District"],
  Telangana: ["Hydrabad", "Rangareddy", "Warangal (U)"],
  Tripura: ["West Tripura", "Gomati"],
  "Uttar Pradesh": ["Lucknow", "Kanpur Nagar", "Ghaziabad"],
  Uttarakhand: ["Dehradun", "Hardwar", "Nainital"],
  "Andaman and Nicobar Islands": ["South Andaman", "North  & Middle Andaman"],
  Chandigarh: ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Diu", "Daman"],
  Delhi: ["New Delhi", "South", "North West"],
  "Jammu and Kashmir": ["Srinagar", "Jammu"],
  Ladakh: ["Leh(Ladakh)", "Kargil"],
  Lakshadweep: ["Lakshadweep"],
  Puducherry: ["Puducherry", "Karaikal"],
};

/** State → district list for the new-proposal form's cascading select. */
export const DISTRICTS_BY_STATE: Record<string, string[]> = DISTRICTS;

const OWNER_NAMES: Record<string, string[]> = {
  Maharashtra: [
    "Sakharam B. Patil",
    "Vandana R. Deshmukh",
    "Ganpat K. More",
    "Sunita M. Jadhav",
    "Ramesh V. Bhosale",
    "Kisan D. Shinde",
  ],
  "Tamil Nadu": [
    "M. Selvaraj",
    "R. Kanagavalli",
    "S. Arumugam",
    "P. Meenakshi Sundaram",
    "K. Rajalakshmi",
    "V. Thangavel",
  ],
  Assam: [
    "Bhupen Kalita",
    "Nayanmoni Baruah",
    "Jitu Hazarika",
    "Pranita Saikia",
    "Dhiren Bordoloi",
    "Runjun Das",
  ],
  Goa: [
    "Anthony D'Souza",
    "Shailesh Naik",
    "Maria Fernandes",
    "Prakash Kerkar",
    "Sanjana Dessai",
    "Rohan Shirodkar",
  ],
  Punjab: [
    "Gurpreet Singh Sandhu",
    "Harjeet Kaur Gill",
    "Balwinder Singh Brar",
    "Manpreet Singh Dhillon",
    "Simranjeet Kaur",
    "Jaswant Singh Sidhu",
  ],
  "West Bengal": [
    "Ashok Kumar Mondal",
    "Rina Chatterjee",
    "Subrata Halder",
    "Mousumi Bhattacharya",
    "Tapan Kumar Das",
    "Ananya Roy",
  ],
  "Andhra Pradesh": [
    "K. Venkata Rao",
    "P. Lakshmi Devi",
    "G. Ramesh Babu",
    "S. Padmavathi",
    "N. Srinivasa Rao",
    "M. Anitha",
  ],
  "Arunachal Pradesh": [
    "Tai Tagak",
    "Yumlam Riba",
    "Nabam Doni",
    "Kani Nada",
    "Taba Tedir",
    "Gyati Rondo",
  ],
  Bihar: [
    "Ramesh Kumar Singh",
    "Sunita Devi",
    "Anil Kumar Yadav",
    "Kavita Kumari",
    "Rajesh Prasad",
    "Meena Devi",
  ],
  Chhattisgarh: [
    "Suresh Kumar Sahu",
    "Rekha Netam",
    "Dilip Sinha",
    "Anita Baghel",
    "Manoj Dewangan",
    "Savitri Nag",
  ],
  Gujarat: [
    "Kiran Patel",
    "Bharat Shah",
    "Nirali Desai",
    "Jayesh Rathwa",
    "Meera Trivedi",
    "Ashok Bhatt",
  ],
  Haryana: [
    "Jagdish Chand Yadav",
    "Sunita Devi Sheoran",
    "Rajbir Singh Malik",
    "Kavita Rani Hooda",
    "Ravinder Dahiya",
    "Poonam Beniwal",
  ],
  "Himachal Pradesh": [
    "Ramesh Chand Thakur",
    "Kamla Devi Sharma",
    "Vijay Kumar Rana",
    "Suman Verma",
    "Dinesh Negi",
    "Anita Chauhan",
  ],
  Jharkhand: [
    "Birsa Soren",
    "Sushila Hansda",
    "Ram Prasad Mahto",
    "Nirmala Kisku",
    "Sanjay Oraon",
    "Kiran Devi",
  ],
  Karnataka: [
    "H. R. Gowda",
    "Lakshmi Shastri",
    "B. K. Nayak",
    "Shobha Kulkarni",
    "Manjunath Reddy",
    "Sharada Hegde",
  ],
  Kerala: [
    "P. K. Mohanan Nair",
    "Suja Thomas",
    "K. V. Rajan Pillai",
    "Beena Varghese",
    "M. Sasidharan",
    "Latha Menon",
  ],
  "Madhya Pradesh": [
    "Ram Kishore Chouhan",
    "Sunita Malviya",
    "Rajesh Dubey",
    "Kavita Tiwari",
    "Suresh Baghel",
    "Mamta Sharma",
  ],
  Manipur: [
    "Yumnam Ibomcha",
    "Laishram Ibetombi",
    "Thokchom Rajen",
    "Khumanthem Sarju",
    "Nongmaithem Rebika",
    "Wahengbam Bijoy",
  ],
  Meghalaya: [
    "Lyngdoh Nongkynrih",
    "Pyngrope Kharkongor",
    "Sangma Momin",
    "Wanhun Marak",
    "Kharsyntiew Diengdoh",
    "Shullai Rynjah",
  ],
  Mizoram: [
    "Lalthanhawla Ralte",
    "Zothanmawii Sailo",
    "Vanlalruata Colney",
    "Lalrinawmi Hnamte",
    "Zoramthanga Pachuau",
    "Lalfakzuali Renthlei",
  ],
  Nagaland: [
    "Neizhalhou Kire",
    "Akum Longkumer",
    "Imtienla Ao",
    "Zhaleo Rio",
    "Chubatemjen Ozukum",
    "Alemla Jamir",
  ],
  Odisha: [
    "Bijoy Ku. Mohanty",
    "Manorama Sahoo",
    "Prasanna Ku. Behera",
    "Sanjukta Panda",
    "Ranjit Nayak",
    "Basanti Mallick",
  ],
  Rajasthan: [
    "Om Prakash Rathore",
    "Kamla Devi Choudhary",
    "Bhanwar Singh Rajput",
    "Santosh Kanwar",
    "Mahendra Meena",
    "Sushila Bishnoi",
  ],
  Sikkim: [
    "Pemba Bhutia",
    "Tshering Lepcha",
    "Kumar Chettri",
    "Sonam Tamang",
    "Yangchen Bhutia",
    "Dawa Sherpa",
  ],
  Telangana: [
    "K. Narsimha Reddy",
    "P. Sujatha",
    "G. Ravi Kumar",
    "M. Padma",
    "S. Venkatesh",
    "T. Anuradha",
  ],
  Tripura: [
    "Biplab Debbarma",
    "Sabitri Reang",
    "Ranjit Tripura",
    "Anita Jamatia",
    "Dilip Kumar Nath",
    "Rina Choudhury",
  ],
  "Uttar Pradesh": [
    "Rajendra Prasad Yadav",
    "Kamla Devi Singh",
    "Suresh Chandra Tiwari",
    "Meera Gupta",
    "Anil Kumar Verma",
    "Sushila Sharma",
  ],
  Uttarakhand: [
    "Prem Singh Rawat",
    "Kamla Devi Bisht",
    "Devendra Negi",
    "Sunita Bhandari",
    "Rajendra Panwar",
    "Meena Rana",
  ],
  "Andaman and Nicobar Islands": [
    "Ashok Kumar Halder",
    "Bina Mondal",
    "Selvam Pillai",
    "Rekha Biswas",
    "Muthu Krishnan",
    "Sabita Roy",
  ],
  Chandigarh: [
    "Harpreet Singh Sethi",
    "Kiran Bedi Kapoor",
    "Manjeet Singh Chadha",
    "Simran Kaur Anand",
    "Rajiv Mehta",
    "Neeta Arora",
  ],
  "Dadra and Nagar Haveli and Daman and Diu": [
    "Ramesh Dubla",
    "Kanta Bhoya",
    "Suresh Vasava",
    "Meena Halpati",
    "Ashok Gamit",
    "Sunita Talpada",
  ],
  Delhi: [
    "Rakesh Kumar Sharma",
    "Sunita Gupta",
    "Vijay Malhotra",
    "Pooja Khanna",
    "Ashok Bhalla",
    "Neha Kapoor",
  ],
  "Jammu and Kashmir": [
    "Ghulam Nabi Wani",
    "Shazia Bano",
    "Bashir Ahmad Dar",
    "Rukhsana Begum",
    "Mohd Yaseen Malik",
    "Farida Bhat",
  ],
  Ladakh: [
    "Tsering Angchok",
    "Padma Dolma",
    "Sonam Wangchuk",
    "Rigzin Chodon",
    "Stanzin Norbu",
    "Diskit Angmo",
  ],
  Lakshadweep: [
    "Koya Musaliar",
    "Fathima Beevi",
    "Ibrahim Kunhi",
    "Ayesha Kutty",
    "Abdul Khader",
    "Sulaiku Beevi",
  ],
  Puducherry: [
    "Selvam Pillai",
    "Kamatchi Ammal",
    "Raghunathan Chettiar",
    "Vijayalakshmi Naidu",
    "Antoine Perumal",
    "Marie Bagavathy",
  ],
};

const REQUIRING_BODIES = [
  "NHAI",
  "Ministry of Railways",
  "State PWD",
  "NTPC",
  "Airports Authority of India",
  "State Industrial Development Corp",
] as const;

const PROJECT_NAMES = [
  "Mumbai–Ahmedabad HSR Corridor – Package 4",
  "NH-66 Six-Laning Kundapura–Surathkal",
  "Chennai Metro Phase II Reach 3",
  "Bharatmala Pariyojana NH-548E Link Road",
  "Guwahati Ring Road – Package 2",
  "NTPC Talcher Super Thermal Expansion – Ash Dyke",
  "Mopa Greenfield Airport – Perimeter Access Corridor",
  "Ludhiana–Bathinda Economic Corridor Package 3",
  "Dedicated Freight Corridor – Eastern Arm Feeder",
  "Salem–Coimbatore Expressway Package 1",
  "Nagpur Metro Phase II Reach 4",
  "Palghar Industrial Township – Phase I",
  "NH-37 Widening Nagaon–Dibrugarh Section",
  "Amritsar Bypass Realignment – Package 2",
  "Madurai Outer Ring Road – Package 5",
  "Thane Creek Bridge Approach Works",
  "NTPC Solar Park – Bathinda Block A",
  "Coimbatore Airport Runway Extension",
  "Raigad Port Connectivity Rail Link",
  "Sonitpur Flood Protection Embankment Corridor",
  "Patiala Bulk Water Transmission Main",
  "South Goa Coastal Highway Realignment",
  "Nashik–Pune Semi High Speed Rail – Package 6",
  "Tiruvallur Industrial Water Pipeline Corridor",
  "Kamrup Multimodal Logistics Park",
  "Kolkata Metro Line 6 Extension",
  "Hugli River Bridge Approach Corridor",
  "Paschim Medinipur Industrial Corridor Link Road",
  "North Twenty Four Parganas Flood Control Embankment",
  "South Twenty Four Parganas Coastal Protection Works",
] as const;

const DOC_TYPES: DocumentRef["type"][] = [
  "SIA_REPORT",
  "SEC_11_NOTIFICATION",
  "SEC_19_DECLARATION",
  "AWARD_ORDER",
  "RR_SCHEME",
];

const DOC_TYPE_LABEL: Record<DocumentRef["type"], string> = {
  SIA_REPORT: "Social Impact Assessment Report",
  SEC_11_NOTIFICATION: "Section 11 Preliminary Notification",
  SEC_19_DECLARATION: "Section 19 Declaration",
  AWARD_ORDER: "Section 23 Award Order",
  RR_SCHEME: "Rehabilitation & Resettlement Scheme",
};

const DOCS_BY_STAGE: Record<RfctlarrStage, DocumentRef["type"][]> = {
  INTAKE: [],
  SIA: [],
  SIA_APPRAISAL: ["SIA_REPORT"],
  SEC_11: ["SIA_REPORT", "SEC_11_NOTIFICATION"],
  SEC_19: ["SIA_REPORT", "SEC_11_NOTIFICATION", "SEC_19_DECLARATION"],
  AWARD: ["SIA_REPORT", "SEC_11_NOTIFICATION", "SEC_19_DECLARATION", "AWARD_ORDER"],
  RR_COMPLETE: DOC_TYPES,
};

/**
 * Anchor for the generator's relative day arithmetic — evaluated once when
 * buildProposals() runs (i.e. at seed time), so seeded stageEnteredAt/
 * initiatedAt dates sit realistically relative to the actual current date.
 */
const GEN_NOW = new Date();

const daysAgoIso = (days: number) => new Date(GEN_NOW.getTime() - days * 86400000).toISOString();

const ulpin = (state: string) => {
  const code = STATE_CODE[state] ?? "IN";
  const body = Array.from({ length: 12 - 2 }, () => ALNUM[Math.floor(rand() * ALNUM.length)]).join(
    "",
  );
  return (code + String(intBetween(1, 24)).padStart(2, "0") + body).slice(0, 14);
};

/**
 * Stage-elapsed buckets: 6 breached, 8 at-risk, rest healthy.
 * Index-driven so the distribution is exact.
 */
const BREACHED_COUNT = 6;
const AT_RISK_COUNT = 8;

const SLA_STAGES: RfctlarrStage[] = ["SIA", "SIA_APPRAISAL", "SEC_11", "SEC_19"];
const STAGE_LIMIT_DAYS: Partial<Record<RfctlarrStage, number>> = {
  SIA: 180,
  SIA_APPRAISAL: 365,
  SEC_11: 365,
  SEC_19: 365,
};

function buildParcels(state: string, count: number, totalCompensation: number): Parcel[] {
  const glossary = GLOSSARY[state] ?? GLOSSARY["Goa"]!;
  const owners = OWNER_NAMES[state] ?? OWNER_NAMES["Goa"]!;
  const weights = Array.from({ length: count }, () => between(0.5, 1.5));
  const weightSum = weights.reduce((a, b) => a + b, 0);

  return Array.from({ length: count }, (_, i) => {
    const assessed = Math.round((totalCompensation * weights[i]!) / weightSum);
    const disbursedRatio = pick([0, 0, 0.25, 0.5, 0.75, 1, 1]);
    const parcelUlpin = ulpin(state);
    return {
      // Seeding (server/prisma/seed.ts) doesn't use this id/provenance/
      // restrictionFlags — Prisma assigns the real id and schema defaults.
      // Present only so this generator satisfies the shared Parcel type.
      id: parcelUlpin,
      ulpin: parcelUlpin,
      khasraNo: `${intBetween(11, 899)}/${intBetween(1, 24)}`,
      vernacularTerm: pick(glossary),
      areaHa: Number(between(0.2, 14).toFixed(2)),
      classification: rand() > 0.72 ? "URBAN" : "RURAL",
      ownerName: pick(owners),
      coOwners: intBetween(0, 7),
      compensationAssessed: assessed,
      compensationDisbursed: Math.round(assessed * disbursedRatio),
      provenance: "LEGACY_MIGRATED",
      restrictionFlags: [],
    } satisfies Parcel;
  });
}

/**
 * Structural placeholders only — sha256/sizeKb/verified get overwritten by
 * server/prisma/seed.ts with values computed from real synthesized file
 * bytes, so every seeded document's hash is genuinely verifiable.
 */
function buildDocuments(stage: RfctlarrStage, proposalId: string): DocumentRef[] {
  return DOCS_BY_STAGE[stage].map((type, i) => ({
    id: `${proposalId}-DOC-${String(i + 1).padStart(2, "0")}`,
    name: `${DOC_TYPE_LABEL[type]} — ${proposalId}.pdf`,
    type,
    uploadedAt: daysAgoIso(intBetween(30, 900)),
    sizeKb: 0,
    sha256: "",
    verified: rand() > 0.08,
    lastVerifiedAt: null,
  }));
}

/**
 * Deterministic demo-data generator. No longer called from the browser
 * bundle — the app now reads real data from the API. Kept here (rather than
 * duplicated in server/prisma/seed.ts) so the one-time DB seed produces the
 * same realistic dataset shape; see server/prisma/seed.ts for the caller.
 */
export function buildProposals(): Proposal[] {
  const states = Object.keys(STATE_CODE);

  return Array.from({ length: 45 }, (_, i) => {
    const id = `PROP-${String(101 + i).padStart(4, "0")}`;
    const state = states[i % states.length]!;
    const district = pick(DISTRICTS[state]!);
    const projectName = PROJECT_NAMES[i % PROJECT_NAMES.length]!;

    // Every proposal that carries an SLA sits on one of the four timed stages.
    const stage: RfctlarrStage =
      i < BREACHED_COUNT + AT_RISK_COUNT ? SLA_STAGES[i % SLA_STAGES.length]! : pick(STAGE_ORDER);

    const limit = STAGE_LIMIT_DAYS[stage];
    let elapsed: number;
    if (limit == null) {
      elapsed = intBetween(20, 240);
    } else if (i < BREACHED_COUNT) {
      elapsed = limit + intBetween(12, 190);
    } else if (i < BREACHED_COUNT + AT_RISK_COUNT) {
      elapsed = limit - intBetween(5, 58);
    } else {
      elapsed = intBetween(15, Math.max(20, limit - 90));
    }

    const stageEnteredAt = daysAgoIso(elapsed);
    const initiatedAt = daysAgoIso(elapsed + intBetween(40, 700));

    const assessed = Math.round(between(40_00_000, 90_00_00_000));
    const parcelCount = intBetween(3, 12);
    const parcels = buildParcels(state, parcelCount, assessed);
    const parcelAssessed = parcels.reduce((s, p) => s + p.compensationAssessed, 0);
    const disbursed = parcels.reduce((s, p) => s + p.compensationDisbursed, 0);

    return {
      id,
      projectName,
      requiringBody: pick(REQUIRING_BODIES),
      state,
      district,
      currentStage: stage,
      stageEnteredAt,
      initiatedAt,
      totalAreaHa: Number(parcels.reduce((s, p) => s + p.areaHa, 0).toFixed(2)),
      affectedFamilies: intBetween(4, 320),
      parcels,
      documents: buildDocuments(stage, id),
      compensation: {
        assessed: parcelAssessed,
        disbursed,
        pending: parcelAssessed - disbursed,
      },
    } satisfies Proposal;
  });
}

export const STATES = Object.keys(STATE_CODE);

/** {name, code} pairs sorted alphabetically — for state-picker UI (e.g. the
 * GIS Map View's district/block boundary selector). */
export const STATE_LIST = Object.entries(STATE_CODE)
  .map(([name, code]) => ({ name, code }))
  .sort((a, b) => a.name.localeCompare(b.name));
export const REQUIRING_BODY_LIST = [...REQUIRING_BODIES];

export function formatINR(value: number): string {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)} L`;
  return `₹${value.toLocaleString("en-IN")}`;
}

/** Full Indian-grouped currency, e.g. ₹1,28,45,000 */
export function formatINRFull(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

/** Compact crore figure, e.g. ₹1,284 Cr */
export function formatCrore(value: number, digits = 0): string {
  return `₹${(value / 1_00_00_000).toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} Cr`;
}
