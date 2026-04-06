import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import CrmSidebar from "./CrmSidebar";
import { useI18n } from "../../../i18n/I18nProvider";

const HamburgerIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h14M3 10h14M3 15h14" />
  </svg>
);

export default function CrmShell() {
  const location = useLocation();
  const { t, dir, isRtl } = useI18n();
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(false);
  const [isDesktopSidebarPinned, setIsDesktopSidebarPinned] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isDesktopSidebarOpen = isDesktopSidebarExpanded || isDesktopSidebarPinned;

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div dir={dir} className="min-h-screen bg-[#070f1d] text-slate-100">
      <div className="min-h-screen">
        <div className={`fixed inset-y-0 z-50 hidden lg:block ${isRtl ? "right-0" : "left-0"} pointer-events-none`}>
          <div className="h-full pointer-events-auto">
            <CrmSidebar
              collapsed={!isDesktopSidebarOpen}
              isPinned={isDesktopSidebarPinned}
              onDesktopMouseEnter={() => setIsDesktopSidebarExpanded(true)}
              onDesktopMouseLeave={() => {
                if (!isDesktopSidebarPinned) {
                  setIsDesktopSidebarExpanded(false);
                }
              }}
              onTogglePin={() => {
                setIsDesktopSidebarPinned((previousPinned) => {
                  const nextPinned = !previousPinned;
                  setIsDesktopSidebarExpanded(nextPinned);
                  return nextPinned;
                });
              }}
            />
          </div>
        </div>

        <div
          className={`fixed inset-y-0 z-50 transition-transform duration-300 ease-out lg:hidden ${isRtl ? "right-0" : "left-0"} ${
            isMobileSidebarOpen ? "translate-x-0" : isRtl ? "translate-x-full" : "-translate-x-full"
          }`}
        >
          <CrmSidebar
            collapsed={false}
            isMobile
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
        </div>

        {isMobileSidebarOpen ? (
          <button
            type="button"
            aria-label={t("shell.closeSidebarBackdrop")}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/65 backdrop-blur-[1px] lg:hidden"
          ></button>
        ) : null}

        <div
          className={`min-w-0 flex-1 flex flex-col transition-[padding] duration-300 ease-out ${
            isRtl
              ? isDesktopSidebarOpen
                ? "lg:pr-[262px]"
                : "lg:pr-[78px]"
              : isDesktopSidebarOpen
                ? "lg:pl-[262px]"
                : "lg:pl-[78px]"
          }`}
        >
          <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#091326]/95 backdrop-blur px-4 py-3 flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label={t("shell.openSidebar")}
              className="h-10 w-10 rounded-lg border border-slate-700 bg-[#12203b] text-slate-100 hover:bg-slate-700/40 flex items-center justify-center"
            >
              <HamburgerIcon />
            </button>
            <div>
              <p className="text-base font-semibold text-white">{t("shell.mobileTitle")}</p>
              <p className="text-xs text-slate-400">{t("shell.mobileSubtitle")}</p>
            </div>
          </header>

          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
