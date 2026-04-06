import { useI18n } from "../../../i18n/I18nProvider";

const GlobeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="10" cy="10" r="7" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h14M10 3a12 12 0 010 14M10 3a12 12 0 000 14" />
  </svg>
);

const ChevronDown = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 7.5L10 12.5 15 7.5" />
  </svg>
);

export default function LanguageSwitcher({ className = "" }) {
  const { locale, setLocale } = useI18n();
  const currentLabel = locale === "ar" ? "العربية" : "English";

  return (
    <label className={`relative inline-flex items-center justify-between gap-2 rounded-lg border border-slate-700 bg-[#18273f]/80 px-3 py-2 text-sm text-slate-200 cursor-pointer ${className}`}>
      <GlobeIcon />
      <span className="text-sm font-medium select-none">{currentLabel}</span>
      <ChevronDown />

      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
        aria-label="Language"
      >
        <option value="en">English</option>
        <option value="ar">العربية</option>
      </select>
    </label>
  );
}
