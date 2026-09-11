export type Lang =
  | "en"
  | "hi"
  | "bn"
  | "te"
  | "mr"
  | "ta"
  | "ur"
  | "gu"
  | "kn"
  | "or"
  | "ml"
  | "pa"
  | "as"
  | "mai"
  | "sat"
  | "ks"
  | "ne"
  | "kok"
  | "sd"
  | "doi"
  | "mni"
  | "brx"
  | "sa";

/** English default, followed by all 22 languages of the Eighth Schedule to the Constitution. */
export const LANGUAGES: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "bn", label: "বাংলা (Bengali)" },
  { value: "te", label: "తెలుగు (Telugu)" },
  { value: "mr", label: "मराठी (Marathi)" },
  { value: "ta", label: "தமிழ் (Tamil)" },
  { value: "ur", label: "اردو (Urdu)" },
  { value: "gu", label: "ગુજરાતી (Gujarati)" },
  { value: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { value: "or", label: "ଓଡ଼ିଆ (Odia)" },
  { value: "ml", label: "മലയാളം (Malayalam)" },
  { value: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { value: "as", label: "অসমীয়া (Assamese)" },
  { value: "mai", label: "मैथिली (Maithili)" },
  { value: "sat", label: "ᱥᱟᱱᱛᱟᱲᱤ (Santali)" },
  { value: "ks", label: "کٲشُر (Kashmiri)" },
  { value: "ne", label: "नेपाली (Nepali)" },
  { value: "kok", label: "कोंकणी (Konkani)" },
  { value: "sd", label: "सिन्धी (Sindhi)" },
  { value: "doi", label: "डोगरी (Dogri)" },
  { value: "mni", label: "মৈতৈলোন্ (Manipuri)" },
  { value: "brx", label: "बर’ (Bodo)" },
  { value: "sa", label: "संस्कृतम् (Sanskrit)" },
];

/** Every language code, in a stable order — handy for building per-language merges. */
export const LANG_CODES: Lang[] = LANGUAGES.map((l) => l.value);

export type TranslationTable = Record<Lang, Record<string, string>>;

/** Shallow-merges any number of per-domain translation tables into one, keyed by language. */
export function mergeTranslations(...tables: TranslationTable[]): TranslationTable {
  const result = {} as TranslationTable;
  for (const lang of LANG_CODES) {
    result[lang] = Object.assign({}, ...tables.map((t) => t[lang] ?? {}));
  }
  return result;
}
