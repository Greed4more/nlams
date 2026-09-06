export type Lang = "en" | "hi";

export const LANGUAGES: { value: Lang; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "hi", label: "हिं" },
];

/**
 * Presentation-layer translations for a small set of high-visibility UI
 * chrome — nav labels, page titles, a few common actions. Not a full
 * translation of every string in the app; see [[i18n-scope]] if extending.
 */
export const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.proposals": "Proposals",
    "nav.calculator": "Compensation Calculator",
    "nav.map": "GIS Map View",
    "page.dashboard.title": "Executive Overview",
    "page.proposals.title": "Proposal Pipeline",
    "page.calculator.title": "Section 26 Compensation Calculator",
    "page.map.title": "Cadastral GIS Viewer",
    "action.signOut": "Sign out",
    "action.exportCsv": "Export CSV",
    "action.print": "Print / Save PDF",
  },
  hi: {
    "nav.dashboard": "डैशबोर्ड",
    "nav.proposals": "प्रस्ताव",
    "nav.calculator": "प्रतिकर परिकलक",
    "nav.map": "जीआईएस मानचित्र दृश्य",
    "page.dashboard.title": "कार्यकारी अवलोकन",
    "page.proposals.title": "प्रस्ताव पाइपलाइन",
    "page.calculator.title": "धारा 26 प्रतिकर परिकलक",
    "page.map.title": "भू-अभिलेख जीआईएस दर्शक",
    "action.signOut": "साइन आउट",
    "action.exportCsv": "सीएसवी निर्यात करें",
    "action.print": "प्रिंट / पीडीएफ सहेजें",
  },
};
