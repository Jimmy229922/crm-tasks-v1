import i18n from "./i18n";

export const LOCALE_STORAGE_KEY = "crmTasksV1.locale";
export const DEFAULT_LOCALE = "en";

export const LOCALE_META = {
  en: { code: "en", dir: "ltr" },
  ar: { code: "ar", dir: "rtl" },
};

export function normalizeLocale(locale) {
  const normalized = String(locale || "").toLowerCase();
  return normalized === "ar" || normalized.startsWith("ar-") ? "ar" : "en";
}

export function getLocaleFromEnvironment() {
  return normalizeLocale(i18n.resolvedLanguage || i18n.language || DEFAULT_LOCALE);
}

export function getLocalizedString(key, options = {}) {
  const locale = normalizeLocale(options.locale || getLocaleFromEnvironment());
  const params = options.params || {};
  const fallback = options.fallback;

  return i18n.t(key, {
    lng: locale,
    ...params,
    defaultValue: typeof fallback === "string" ? fallback : String(key),
  });
}

export function getLocaleDirection(locale) {
  return LOCALE_META[normalizeLocale(locale)].dir;
}
