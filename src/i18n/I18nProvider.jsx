import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  getLocaleDirection,
  getLocaleFromEnvironment,
  getLocalizedString,
  normalizeLocale,
} from "./catalog";

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => normalizeLocale(getLocaleFromEnvironment() || DEFAULT_LOCALE));

  useEffect(() => {
    if (typeof document !== "undefined") {
      const direction = getLocaleDirection(locale);
      document.documentElement.lang = locale;
      document.documentElement.dir = direction;
      document.body?.setAttribute("dir", direction);
    }

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      } catch {
        // no-op
      }
    }
  }, [locale]);

  const setLocale = useCallback((nextLocale) => {
    const normalizedLocale = normalizeLocale(nextLocale);

    if (normalizedLocale === locale) {
      return;
    }

    setLocaleState(normalizedLocale);

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, normalizedLocale);
      } catch {
        // no-op
      }

      window.location.reload();
    }
  }, [locale]);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "ar" ? "en" : "ar");
  }, [locale, setLocale]);

  const t = useCallback(
    (key, params, fallback) => getLocalizedString(key, { locale, params, fallback }),
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      dir: getLocaleDirection(locale),
      isRtl: getLocaleDirection(locale) === "rtl",
      setLocale,
      toggleLocale,
      t,
    }),
    [locale, setLocale, toggleLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}
