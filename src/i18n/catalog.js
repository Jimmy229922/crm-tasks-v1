import ar from "../locales/ar.json";
import en from "../locales/en.json";

export const LOCALE_STORAGE_KEY = "crmTasksV1.locale";
export const DEFAULT_LOCALE = "en";

export const LOCALE_META = {
  en: { code: "en", dir: "ltr" },
  ar: { code: "ar", dir: "rtl" },
};

const CATALOGS = {
  en,
  ar,
};

export function normalizeLocale(locale) {
  const normalized = String(locale || "").toLowerCase();
  return normalized === "ar" || normalized.startsWith("ar-") ? "ar" : "en";
}

function isSupportedLocale(locale) {
  const normalized = String(locale || "").toLowerCase();
  return normalized === "ar" || normalized === "en" || normalized.startsWith("ar-") || normalized.startsWith("en-");
}

export function getLocaleFromEnvironment() {
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isSupportedLocale(stored)) {
        return normalizeLocale(stored);
      }
    } catch {
      // no-op
    }
  }

  if (typeof document !== "undefined") {
    const docLang = String(document.documentElement.lang || "").toLowerCase();
    if (isSupportedLocale(docLang)) {
      return normalizeLocale(docLang);
    }
  }

  if (typeof window !== "undefined") {

    const browserLanguage = String(window.navigator?.language || "").toLowerCase();
    if (isSupportedLocale(browserLanguage)) {
      return normalizeLocale(browserLanguage);
    }
  }

  return DEFAULT_LOCALE;
}

function resolvePathValue(source, path) {
  return String(path)
    .split(".")
    .reduce((result, segment) => (result && typeof result === "object" ? result[segment] : undefined), source);
}

function interpolateTemplate(template, params = {}) {
  return String(template).replace(/{{\s*([\w]+)\s*}}/g, (_, key) => {
    if (!Object.prototype.hasOwnProperty.call(params, key)) {
      return "";
    }

    const value = params[key];
    return value === null || value === undefined ? "" : String(value);
  });
}

export function getLocalizedString(key, options = {}) {
  const locale = normalizeLocale(options.locale || getLocaleFromEnvironment());
  const params = options.params || {};
  const fallback = options.fallback;

  const localeCatalog = CATALOGS[locale] || CATALOGS[DEFAULT_LOCALE];
  const fallbackCatalog = CATALOGS[DEFAULT_LOCALE];

  const rawValue = resolvePathValue(localeCatalog, key) ?? resolvePathValue(fallbackCatalog, key);

  if (typeof rawValue === "string") {
    return interpolateTemplate(rawValue, params);
  }

  if (typeof fallback === "string") {
    return interpolateTemplate(fallback, params);
  }

  return String(key);
}

export function getLocaleDirection(locale) {
  return LOCALE_META[normalizeLocale(locale)].dir;
}
