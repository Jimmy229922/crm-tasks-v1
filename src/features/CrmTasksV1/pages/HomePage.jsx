import { useNavigate } from "react-router-dom";
import { useI18n } from "../../../i18n/I18nProvider";
import LanguageSwitcher from "../layout/LanguageSwitcher";

const UserIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="10" cy="7" r="3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 17a6 6 0 0112 0" />
  </svg>
);

export default function HomePage() {
  const navigate = useNavigate();
  const { t, isRtl } = useI18n();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_70%_30%,rgba(57,189,217,0.22),transparent_44%),linear-gradient(102deg,#01091b_0%,#081530_45%,#152436_100%)] text-slate-100">
      <div className="max-w-[1420px] mx-auto px-6 lg:px-10 py-6 lg:py-10">
        <div className={`flex items-center ${isRtl ? "justify-start" : "justify-end"} gap-3`}>
          <LanguageSwitcher />
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#1c2e48]/80 px-3 py-2 text-sm text-slate-200">
            <UserIcon />
            <span>{t("homePage.userName")}</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <section>
            <h1 className="text-[58px] leading-[1.02] font-black tracking-tight text-cyan-300">{t("homePage.title")}</h1>
            <h2 className="mt-3 text-[40px] leading-tight font-semibold text-blue-300">{t("homePage.subtitle")}</h2>
            <p className="mt-6 max-w-xl text-[25px] leading-relaxed text-slate-200">{t("homePage.description")}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/crm/tasks-v1/risk-management")}
                className="rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 px-6 py-3 font-semibold transition-colors"
              >
                {t("homePage.openDashboard")}
              </button>
              <button
                type="button"
                onClick={() => navigate("/crm/tasks-v1/risk-management")}
                className="rounded-xl border border-slate-500 bg-[#0f1d35]/70 hover:bg-slate-700/45 px-6 py-3 font-semibold transition-colors"
              >
                {t("homePage.openTasks")}
              </button>
            </div>
          </section>

          <section className="relative h-[500px] sm:h-[560px]">
            <div className="absolute inset-0 rounded-[36px] bg-[radial-gradient(circle_at_25%_25%,rgba(77,223,239,0.2),transparent_35%),linear-gradient(160deg,rgba(34,75,125,0.45),rgba(13,20,37,0.8))] border border-cyan-400/20 shadow-[0_30px_80px_rgba(1,10,28,0.9)]"></div>

            <div className="absolute bottom-12 left-10 right-10 grid grid-cols-4 gap-4 items-end">
              <div className="h-28 rounded-lg bg-cyan-500/30 border border-cyan-400/30"></div>
              <div className="h-44 rounded-lg bg-blue-500/25 border border-blue-400/30"></div>
              <div className="h-36 rounded-lg bg-indigo-500/25 border border-indigo-400/30"></div>
              <div className="h-52 rounded-lg bg-cyan-400/25 border border-cyan-300/40"></div>
            </div>

            <div className="absolute left-10 top-14 w-[72%] rounded-2xl border border-slate-300/40 bg-[#122849]/65 p-4 backdrop-blur-sm">
              <div className="h-24 rounded-xl border border-slate-200/30 bg-[linear-gradient(120deg,rgba(75,196,255,0.12),rgba(255,255,255,0.03))] relative overflow-hidden">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 120" fill="none">
                  <path d="M0 95 C70 85, 110 70, 170 78 C220 85, 270 30, 330 44 C385 57, 430 20, 500 28" stroke="rgba(68,239,255,0.95)" strokeWidth="4" />
                </svg>
              </div>
            </div>

            <div className="absolute right-8 top-24 grid gap-3">
              <div className="w-36 h-20 rounded-xl border border-slate-200/45 bg-[#24466d]/65 backdrop-blur-sm"></div>
              <div className="w-40 h-24 rounded-xl border border-slate-200/45 bg-[#1b3351]/65 backdrop-blur-sm"></div>
              <div className="w-32 h-16 rounded-xl border border-slate-200/45 bg-[#24466d]/65 backdrop-blur-sm"></div>
            </div>

            <div className="absolute left-6 bottom-20 rounded-xl border border-cyan-300/40 bg-[#17325b]/80 px-4 py-2 text-sm text-cyan-100">
              {t("homePage.visualBadge")}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
