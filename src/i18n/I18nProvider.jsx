import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_LOCALE,
  getLocaleDirection,
  normalizeLocale,
} from "./catalog";

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const { t: i18nTranslate, i18n } = useTranslation();
  const [locale, setLocaleState] = useState(() => normalizeLocale(i18n.resolvedLanguage || i18n.language || DEFAULT_LOCALE));

  useEffect(() => {
    const nextLocale = normalizeLocale(i18n.resolvedLanguage || i18n.language || DEFAULT_LOCALE);
    if (nextLocale !== locale) {
      setLocaleState(nextLocale);
    }
  }, [i18n.language, i18n.resolvedLanguage, locale]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const direction = getLocaleDirection(locale);
      document.documentElement.lang = locale;
      document.documentElement.dir = direction;
      document.body?.setAttribute("dir", direction);
    }
  }, [locale]);

  const setLocale = useCallback((nextLocale) => {
    const normalizedLocale = normalizeLocale(nextLocale);

    if (normalizedLocale === locale) {
      return;
    }

    i18n.changeLanguage(normalizedLocale);
  }, [i18n, locale]);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "ar" ? "en" : "ar");
  }, [locale, setLocale]);

  const t = useCallback(
    (key, params, fallback) => i18nTranslate(key, {
      ...(params || {}),
      defaultValue: typeof fallback === "string" ? fallback : key,
    }),
    [i18nTranslate]
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
