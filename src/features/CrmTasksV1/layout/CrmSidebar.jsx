import { useLocation, useNavigate } from "react-router-dom";
import { SIDEBAR_MENU_ITEMS } from "./sidebarMenu";
import { useI18n } from "../../../i18n/I18nProvider";
import LanguageSwitcher from "./LanguageSwitcher";

const ICON_CLASS = "w-[18px] h-[18px] shrink-0";

const HomeIcon = ({ className = ICON_CLASS }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-4.5v-6h-5v6H5a1 1 0 01-1-1v-9.5z" />
  </svg>
);

const PeopleIcon = ({ className = ICON_CLASS }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 11a3 3 0 100-6 3 3 0 000 6zm8 1a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 20a6 6 0 0112 0m-1 0h7a4.5 4.5 0 00-9 0" />
  </svg>
);

const ShieldIcon = ({ className = ICON_CLASS }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5.5c0 4.6-2.9 7.8-7 9.5-4.1-1.7-7-4.9-7-9.5V6l7-3z" />
  </svg>
);

const UserIcon = ({ className = ICON_CLASS }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <circle cx="12" cy="8" r="3.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 20a7 7 0 0114 0" />
  </svg>
);

const MoneyIcon = ({ className = ICON_CLASS }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h.01M17 15h.01" />
  </svg>
);

const MailIcon = ({ className = ICON_CLASS }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8l8 6 8-6" />
  </svg>
);

const BuildingIcon = ({ className = ICON_CLASS }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V5.5A1.5 1.5 0 015.5 4h6A1.5 1.5 0 0113 5.5V21M13 9h7v12M8.5 8.5v.01M8.5 12v.01M8.5 15.5v.01" />
  </svg>
);

const ChatIcon = ({ className = ICON_CLASS }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 17l-2 3v-3a7 7 0 117 7h-1" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 8h.01M16.5 8h.01M10 8h.01" />
  </svg>
);

const LogoutIcon = ({ className = ICON_CLASS }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5M21 12H9" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 7.5L10 12.5 15 7.5" />
  </svg>
);

const MobileCloseIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5l10 10M15 5L5 15" />
  </svg>
);

const PinIcon = ({ pinned }) => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d={pinned ? "M7 3h6l-1.4 4.2 2.4 2.3H6l2.4-2.3L7 3zM10 9.5V16" : "M7 3h6l-1.4 4.2 2.4 2.3H6l2.4-2.3L7 3z"}
    />
  </svg>
);

const ICONS_BY_ID = {
  home: HomeIcon,
  clients: PeopleIcon,
  "risk-management": ShieldIcon,
  users: UserIcon,
  financial: MoneyIcon,
  "accounts-emails": MailIcon,
  ib: BuildingIcon,
  chat: ChatIcon,
  logout: LogoutIcon,
};

function SidebarItem({ item, collapsed, active, onClick }) {
  const Icon = ICONS_BY_ID[item.id] || HomeIcon;
  const { t } = useI18n();
  const label = item.labelKey ? t(item.labelKey, null, item.label) : item.label;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full flex items-center rounded-xl border transition-colors duration-200 ${
        collapsed ? "justify-center h-11 px-2" : "justify-between h-11 px-3"
      } ${
        active
          ? "border-blue-400/40 bg-[#2d5fb4] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
          : "border-transparent text-slate-200 hover:bg-slate-700/40"
      }`}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
    >
      <span className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
        <Icon className={ICON_CLASS} />
        {collapsed ? null : <span className="text-sm font-medium tracking-[0.01em]">{label}</span>}
      </span>

      {collapsed || !item.hasChevron ? null : <ChevronDownIcon />}
    </button>
  );
}

export default function CrmSidebar({
  collapsed,
  isPinned = false,
  onDesktopMouseEnter,
  onDesktopMouseLeave,
  onTogglePin,
  isMobile = false,
  onCloseMobile,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isRtl } = useI18n();

  const isHomeActive = location.pathname.startsWith("/crm/tasks-v1/home");
  const isRiskManagementActive = !isHomeActive && (
    location.pathname.startsWith("/crm/tasks-v1/risk-management")
    || location.pathname.startsWith("/crm/tasks-v1/task/")
    || location.pathname.startsWith("/crm/tasks-v1/profile/")
  );
  const primaryItems = SIDEBAR_MENU_ITEMS.filter((item) => item.id !== "logout");
  const logoutItem = SIDEBAR_MENU_ITEMS.find((item) => item.id === "logout");

  const handleItemClick = (item) => {
    if (item.path) {
      navigate(item.path);
    }

    if (isMobile && typeof onCloseMobile === "function") {
      onCloseMobile();
    }
  };

  return (
    <aside
      onMouseEnter={isMobile ? undefined : onDesktopMouseEnter}
      onMouseLeave={isMobile ? undefined : onDesktopMouseLeave}
      className={`relative h-full ${isRtl ? "border-l" : "border-r"} border-slate-800/90 bg-[radial-gradient(circle_at_10%_0%,#12203f_0%,#0a1326_42%,#081120_100%)] transition-[width] duration-300 ease-out ${
        collapsed ? "w-[78px]" : "w-[262px]"
      }`}
    >
      <div className={`h-full flex flex-col ${collapsed ? "px-2.5 py-4" : "px-3 py-4"}`}>
        <div className="relative mb-6 rounded-xl border border-slate-700/80 bg-[#0d1628]/90 px-3 py-3">
          <div className={`min-h-[72px] flex ${collapsed ? "items-center justify-center" : "items-start justify-start"}`}>
            {collapsed ? (
              <div className="flex flex-col items-center leading-none">
                <span className="text-[46px] font-black tracking-tight text-[#1980ff]">T</span>
                <span className="text-[46px] font-black -mt-2 tracking-tight text-[#1980ff]">P</span>
              </div>
            ) : (
              <div>
                <h2 className="text-[38px] leading-[1.05] font-black tracking-tight text-[#1980ff]">{t("sidebar.brandTitle")}</h2>
                <p className="mt-1 text-[15px] tracking-wide text-slate-400">{t("sidebar.brandSubtitle")}</p>
              </div>
            )}
          </div>

          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label={t("shell.closeSidebar")}
              className="absolute right-2 top-2 h-7 w-7 rounded-md border border-slate-600/70 bg-[#15233f] text-slate-200 hover:bg-slate-700/50 flex items-center justify-center"
            >
              <MobileCloseIcon />
            </button>
          ) : null}
        </div>

        {isMobile || collapsed ? null : (
          <button
            type="button"
            onClick={onTogglePin}
            aria-label={isPinned ? t("shell.unpinSidebar") : t("shell.pinSidebar")}
            title={isPinned ? t("shell.unpinSidebar") : t("shell.pinSidebar")}
            className={`absolute top-20 z-20 h-8 w-8 rounded-full border shadow-lg flex items-center justify-center transition-colors ${
              isRtl ? "-left-3" : "-right-3"
            } ${
              isPinned
                ? "border-cyan-300/80 bg-cyan-400/25 text-cyan-100"
                : "border-slate-600/80 bg-[#15233f] text-slate-200 hover:bg-slate-700/60"
            }`}
          >
            <PinIcon pinned={isPinned} />
          </button>
        )}

        {collapsed && !isMobile ? null : (
          <div className="mb-4">
            <LanguageSwitcher className="w-full justify-between" />
          </div>
        )}

        <nav className="flex-1 overflow-y-auto pr-0.5 space-y-1.5">
          {primaryItems.map((item) => {
            const isActive = (item.id === "home" && isHomeActive) || (item.id === "risk-management" && isRiskManagementActive);

            return (
              <SidebarItem
                key={item.id}
                item={item}
                collapsed={collapsed}
                active={isActive}
                onClick={() => handleItemClick(item)}
              />
            );
          })}
        </nav>

        {logoutItem ? (
          <div className="pt-2 border-t border-slate-800/70">
            <SidebarItem
              item={logoutItem}
              collapsed={collapsed}
              active={false}
              onClick={() => handleItemClick(logoutItem)}
            />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
