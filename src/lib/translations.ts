import { LANGUAGES, LANG_CODES, mergeTranslations, type Lang, type TranslationTable } from "./i18n/langs";
import { BASE_TRANSLATIONS } from "./i18n/base";
import { COMMON_TRANSLATIONS } from "./i18n/common";

export type { Lang };
export { LANGUAGES, LANG_CODES };

/**
 * Full merged translation table — English default plus all 22 languages of
 * the Eighth Schedule. Composed from `src/lib/i18n/*`: `base` (nav/page
 * chrome) + `common` (shared labels, stage/status maps) + one file per app
 * area, so each area can be translated independently without merge
 * conflicts. Add a new domain file under `src/lib/i18n/` and list it here.
 */
export const TRANSLATIONS: TranslationTable = mergeTranslations(BASE_TRANSLATIONS, COMMON_TRANSLATIONS);
