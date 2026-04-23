import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getClientById,
  getTaskTypeLabel,
  getTasksByClientId,
} from "../data/mockTasks";
import { useI18n } from "../../../i18n/I18nProvider";
import TaskDetailsPage from "./TaskDetailsPage";

const EMAIL_SENDER = "support@inzo.co";
const V2_SECTION_IDS = ["details", "activity", "accounts", "emails", "journal", "card", "documents"];
const V2_SECTION_LOAD_DELAY_MS = 320;

function createV2SectionState(initialValue = false) {
  return V2_SECTION_IDS.reduce((result, sectionId) => {
    result[sectionId] = initialValue;
    return result;
  }, {});
}

function parseDateValue(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function normalizeEventName(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "TASK_EVENT";
}

function toEmailTypeLabel(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `EMAIL_${normalized || "UPDATE"}`;
}

function csvEscape(value) {
  const text = String(value ?? "");
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

function toIsoDateLabel(value) {
  const parsed = parseDateValue(value);

  if (!parsed) {
    return "-";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function asDisplayValue(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "string" && value.trim() === "") {
    return "-";
  }

  return value;
}

function getDocumentStatusTone(status) {
  const normalized = String(status || "").trim().toUpperCase();

  if (normalized === "APPROVED") {
    return "text-emerald-300";
  }

  if (normalized === "DECLINED") {
    return "text-rose-300";
  }

  return "text-slate-300";
}

function normalizeTaskStatusKey(status) {
  return String(status || "").trim().toUpperCase().replace(/\s+/g, "_");
}

function formatCurrencyAmount(value, locale) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return "$0.00";
  }

  const formatted = numeric.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `$${formatted}`;
}

function formatRelativeFromNow(value, locale, t) {
  const parsed = parseDateValue(value);

  if (!parsed) {
    return "-";
  }

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 60) {
    return t("taskProfilePage.accountsTasks.minutesAgo", { count: diffMinutes }, `${diffMinutes} min ago`);
  }

  const diffHours = Math.max(1, Math.floor(diffMinutes / 60));

  if (diffHours < 24) {
    return t("taskProfilePage.accountsTasks.hoursAgo", { count: diffHours }, `${diffHours} h ago`);
  }

  const diffDays = Math.max(1, Math.floor(diffHours / 24));

  return t("taskProfilePage.accountsTasks.daysAgo", { count: diffDays }, `${diffDays} d ago`);
}

function getCountryCode(country) {
  const normalized = String(country || "").trim();

  if (!normalized) {
    return "-";
  }

  const countryCodeMap = {
    UAE: "AE",
    KSA: "SA",
    Egypt: "EG",
    Qatar: "QA",
    Bahrain: "BH",
    Jordan: "JO",
    Kuwait: "KW",
    Oman: "OM",
    Iraq: "IQ",
  };

  return countryCodeMap[normalized] || normalized.slice(0, 2).toUpperCase();
}

function DetailsSectionHeader({ title }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-5 w-5 rounded-full bg-violet-500/30 border border-violet-400/40 text-violet-200 text-[11px] font-bold flex items-center justify-center">
        i
      </span>
      <h3 className="text-[28px] leading-tight font-semibold text-white">{title}</h3>
    </div>
  );
}

function DetailsKeyValueTable({ rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/80 bg-[#0f1727]">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-700/70 last:border-b-0">
              <th className="w-[34%] bg-[#18243a] px-4 py-2.5 text-start text-slate-300 font-medium">
                {row.label}
              </th>
              <td className="px-4 py-2.5 text-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>{asDisplayValue(row.value)}</span>
                  {row.actionLabel ? (
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded border border-sky-500/60 bg-sky-500/15 text-sky-200 text-xs font-semibold hover:bg-sky-500/25"
                    >
                      {row.actionLabel}
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function V2AccordionSection({
  title,
  subtitle,
  isOpen,
  isLoading,
  isLoaded,
  onToggle,
  loadingLabel,
  children,
  colorClass = "bg-sky-500",
  badgeCount = null,
  isStatic = false,
}) {
  return (
    <article className="rounded-xl border border-slate-700/80 bg-[#0f1727] shadow-sm overflow-hidden mb-4">
      <button
        type="button"
        onClick={isStatic ? undefined : onToggle}
        disabled={isStatic}
        className={`w-full flex flex-row items-center justify-between p-4 sm:p-5 transition-colors select-none outline-none text-left ${isStatic ? "cursor-default border-b border-slate-700/80 bg-[#0b121f]" : "hover:bg-[#162133] cursor-pointer"}`}
      >
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-4 rounded-full ${colorClass}`}></div>
            <h3 className="text-[17px] font-semibold tracking-wide text-slate-200">{title}</h3>
          </div>
          {subtitle ? <p className="text-[11px] text-slate-400 ltr:ml-4 rtl:mr-4 mt-0.5">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {badgeCount !== null && (
            <span className="bg-slate-700/60 text-slate-300 font-bold text-xs px-2.5 py-0.5 rounded border border-slate-600/50">
              {badgeCount}
            </span>
          )}
          {!isStatic && (
            <svg
              className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>

      {(isOpen || isStatic) ? (
        <div className={`px-4 sm:px-6 py-5 bg-[#0b121f] ${!isStatic && "border-t border-slate-700/80"}`}>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-sm text-slate-400 animate-pulse">{loadingLabel}</p>
            </div>
          ) : (isLoaded || isStatic) ? (
            children
          ) : (
            <div className="flex items-center justify-center p-8">
              <p className="text-sm text-slate-400 animate-pulse">{loadingLabel}</p>
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}

export default function TaskProfilePage() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { t, locale, isRtl } = useI18n();

  const [openTaskDetailsId, setOpenTaskDetailsId] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteError, setNoteError] = useState("");
  const [activityNotes, setActivityNotes] = useState([]);
  const [emailTypeFilter, setEmailTypeFilter] = useState("all");
  const [workspaceModal, setWorkspaceModal] = useState(null);
  const [selectedPayload, setSelectedPayload] = useState(null);
  const [lastResentEmailId, setLastResentEmailId] = useState(null);
  const [isV2Mode, setIsV2Mode] = useState(false);
  const [isV3Mode, setIsV3Mode] = useState(false);
  const [isV3NoteAccordionOpen, setIsV3NoteAccordionOpen] = useState(false);
  const [isV3TradingAccountsOpen, setIsV3TradingAccountsOpen] = useState(false);
  const [isV3DocumentsOpen, setIsV3DocumentsOpen] = useState(false);
  const [isV3OpenTasksOpen, setIsV3OpenTasksOpen] = useState(false);
  const [isV3ClosedTasksOpen, setIsV3ClosedTasksOpen] = useState(false);
  const [isV3EmailMessagesOpen, setIsV3EmailMessagesOpen] = useState(false);
  const [isV3ClientJournalOpen, setIsV3ClientJournalOpen] = useState(false);
  const [v2OpenSections, setV2OpenSections] = useState(() => createV2SectionState(false));
  const [v2LoadedSections, setV2LoadedSections] = useState(() => createV2SectionState(false));
  const [v2LoadingSections, setV2LoadingSections] = useState(() => createV2SectionState(false));
  const v2LoadTimeoutsRef = useRef({});

  const resetV2SectionsState = () => {
    Object.values(v2LoadTimeoutsRef.current).forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });

    v2LoadTimeoutsRef.current = {};
    setV2OpenSections(createV2SectionState(false));
    setV2LoadedSections(createV2SectionState(false));
    setV2LoadingSections(createV2SectionState(false));
  };

  const triggerV2SectionLoad = (sectionId) => {
    if (v2LoadedSections[sectionId] || v2LoadingSections[sectionId]) {
      return;
    }

    setV2LoadingSections((previous) => ({
      ...previous,
      [sectionId]: true,
    }));

    const timeoutId = setTimeout(() => {
      setV2LoadedSections((previous) => ({
        ...previous,
        [sectionId]: true,
      }));

      setV2LoadingSections((previous) => ({
        ...previous,
        [sectionId]: false,
      }));

      delete v2LoadTimeoutsRef.current[sectionId];
    }, V2_SECTION_LOAD_DELAY_MS);

    v2LoadTimeoutsRef.current[sectionId] = timeoutId;
  };

  const handleToggleV2Section = (sectionId) => {
    const willOpen = !v2OpenSections[sectionId];

    setV2OpenSections((previous) => ({
      ...previous,
      [sectionId]: willOpen,
    }));

    if (willOpen) {
      triggerV2SectionLoad(sectionId);
    }
  };

  const handleToggleV2Mode = () => {
    const nextMode = !isV2Mode;

    setIsV2Mode(nextMode);
    if (nextMode) setIsV3Mode(false);
    setWorkspaceModal(null);

    if (nextMode) {
      setSelectedPayload(null);
      setOpenTaskDetailsId(null);
      resetV2SectionsState();
    }
  };

  const handleToggleV3Mode = () => {
    const nextMode = !isV3Mode;
    setIsV3Mode(nextMode);
    if (nextMode) setIsV2Mode(false);
    setWorkspaceModal(null);
  };

  const formatDateTime = (value) => {
    const parsed = parseDateValue(value);

    if (!parsed) {
      return t("common.na");
    }

    return parsed.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const client = useMemo(() => getClientById(clientId), [clientId]);

  const clientTasks = useMemo(() => {
    const tasks = getTasksByClientId(clientId);

    return [...tasks].sort((left, right) => {
      const leftDate = parseDateValue(left.created || left.createdAt || left.due || left.dueDate);
      const rightDate = parseDateValue(right.created || right.createdAt || right.due || right.dueDate);

      return (rightDate?.getTime() || 0) - (leftDate?.getTime() || 0);
    });
  }, [clientId]);

  const taskTimelineDateValues = useMemo(
    () => clientTasks.map((task) => parseDateValue(task.created || task.createdAt || task.due || task.dueDate)).filter(Boolean),
    [clientTasks]
  );

  const primaryTask = useMemo(() => clientTasks[0] || null, [clientTasks]);

  const registrationDate = useMemo(() => {
    if (taskTimelineDateValues.length === 0) {
      return "-";
    }

    const oldest = taskTimelineDateValues.reduce((previous, current) => (
      current.getTime() < previous.getTime() ? current : previous
    ));

    return toIsoDateLabel(oldest.toISOString());
  }, [taskTimelineDateValues]);

  const latestLoginLabel = useMemo(() => {
    const candidate = parseDateValue(primaryTask?.created || primaryTask?.createdAt || primaryTask?.due || primaryTask?.dueDate);
    return candidate ? candidate.toISOString() : null;
  }, [primaryTask]);

  const addressParts = useMemo(() => {
    const source = String(client?.address || "");
    return source.split(",").map((part) => part.trim()).filter(Boolean);
  }, [client]);

  const generalInfoLeftRows = useMemo(() => ([
    { id: "name", label: t("common.name", "Name"), value: client?.name || "Aqeel Hussein" },
    { id: "email", label: t("common.email", "Email"), value: client?.email || "qylmlak464@gmail.com" },
    { id: "phone", label: t("common.phone", "Phone"), value: client?.phone || "+9647749032354" },
    { id: "skype", label: "Skype", value: "-" },
    { id: "birth-date", label: "Birth Date", value: "-" },
    { id: "agent-account", label: "Agent Account", value: "3169063" },
    { id: "license-type", label: t("taskProfilePage.details.general.licenseType", "License Type"), value: "false" },
    { id: "risk", label: t("taskProfilePage.details.general.risk", "Risk"), value: "-" },
    { id: "status", label: t("taskProfilePage.details.general.status", "Status"), value: "Active", tone: "success" },
  ]), [client, t]);

  const generalInfoRightRows = useMemo(() => ([
    { id: "account-type", label: t("taskProfilePage.details.general.accountType", "Account Type"), value: "Retail" },
    { id: "lead-type", label: "Lead Type", value: client?.type || "Client" },
    { id: "address", label: t("common.address", "Address"), value: addressParts[0] || "alive" },
    { id: "city", label: t("taskProfilePage.details.general.city", "City"), value: addressParts[1] || "Wasit" },
    { id: "state", label: t("taskProfilePage.details.general.state", "State"), value: addressParts[1] || "Wasit" },
    { id: "zip", label: "Zip", value: "52011" },
    { id: "country", label: t("common.country", "Country"), value: client?.country || "Iraq" },
    { id: "registration-form", label: t("taskProfilePage.details.general.registrationForm", "Registration Form"), value: "Open Live Account" },
    { id: "registration-date", label: t("taskProfilePage.details.general.registrationDate", "Registration Date"), value: registrationDate || "2026-03-08" },
  ]), [client, addressParts, registrationDate, t]);

  const headerProfileFacts = [
    {
      id: "status",
      label: t("taskProfilePage.details.general.status"),
      value: "Active",
      tone: "success",
    },
    {
      id: "account-type",
      label: t("taskProfilePage.details.general.accountType"),
      value: "Retail",
      tone: "default",
    },
    {
      id: "registration-date",
      label: t("taskProfilePage.details.general.registrationDate"),
      value: registrationDate,
      tone: "default",
    },
    {
      id: "latest-login",
      label: t("taskProfilePage.details.additional.latestLogin"),
      value: latestLoginLabel ? formatDateTime(latestLoginLabel) : "-",
      tone: "default",
    },
    {
      id: "registration-form",
      label: t("taskProfilePage.details.general.registrationForm"),
      value: "Open Live Account",
      tone: "default",
    },
    {
      id: "city-state",
      label: isRtl
        ? "المدينة / المحافظة"
        : `${t("taskProfilePage.details.general.city")} / ${t("taskProfilePage.details.general.state")}`,
      value: [addressParts[0], addressParts[1]].filter(Boolean).join(" / ") || "-",
      tone: "default",
    },
    {
      id: "risk",
      label: t("taskProfilePage.details.general.risk"),
      value: "-",
      tone: "default",
    },
    {
      id: "license-type",
      label: t("taskProfilePage.details.general.licenseType"),
      value: "false",
      tone: "default",
    },
  ];

  const experienceInfoLeftRows = useMemo(() => ([
    {
      id: "education",
      label: t("taskProfilePage.details.experience.education"),
      value: "Other",
    },
    {
      id: "experience",
      label: t("taskProfilePage.details.experience.experience"),
      value: "None",
    },
    {
      id: "frequency",
      label: t("taskProfilePage.details.experience.tradingFrequency"),
      value: "< 5",
    },
    {
      id: "average",
      label: t("taskProfilePage.details.experience.averageTrading"),
      value: "Less then 50,000",
    },
    {
      id: "purpose",
      label: t("taskProfilePage.details.experience.tradingPurpose"),
      value: "Investment",
    },
  ]), [t]);

  const experienceInfoRightRows = useMemo(() => ([
    {
      id: "annual-gross",
      label: t("taskProfilePage.details.experience.annualGross"),
      value: "Less then 25,000",
    },
    {
      id: "net-worth",
      label: t("taskProfilePage.details.experience.netWorth"),
      value: "Less then 100,000",
    },
    {
      id: "income-source",
      label: t("taskProfilePage.details.experience.incomeSource"),
      value: "Self Employed",
    },
    {
      id: "public-position",
      label: t("taskProfilePage.details.experience.publicPosition"),
      value: "No",
    },
  ]), [t]);

  const additionalInfoLeftRows = useMemo(() => ([
    {
      id: "ip-address",
      label: t("taskProfilePage.details.additional.ipAddress"),
      value: "37.237.228.156",
    },
    {
      id: "country-ip",
      label: t("taskProfilePage.details.additional.countryByIp"),
      value: "IQ",
    },
    {
      id: "city-ip",
      label: t("taskProfilePage.details.additional.cityByIp"),
      value: "-",
    },
    {
      id: "conversion-page",
      label: t("taskProfilePage.details.additional.conversionPage"),
      value: "-",
    },
    {
      id: "referrer",
      label: t("taskProfilePage.details.additional.referrer"),
      value: "-",
    },
  ]), [t]);

  const additionalInfoRightRows = useMemo(() => ([
    {
      id: "url-keywords",
      label: t("taskProfilePage.details.additional.urlKeywords"),
      value: "-",
    },
    {
      id: "latest-login",
      label: t("taskProfilePage.details.additional.latestLogin"),
      value: "20 Apr 2026 16:43:21",
    },
    {
      id: "latest-trade",
      label: t("taskProfilePage.details.additional.latestTrade"),
      value: "-",
    },
  ]), [t]);

  const detailsDocuments = useMemo(() => ([
    {
      id: "doc-id-front",
      type: "Doc Type Copy Of Id Front",
      status: "DECLINED",
      expiresOn: "15 Mar 2023",
      reviewedBy: t("taskProfilePage.details.documentsTable.none"),
      submittedBy: t("taskProfilePage.details.documentsTable.client"),
      submittedOn: "14 Mar 2023 01:53:40",
      checkedOn: "09 Jan 2025 09:49:33",
    },
    {
      id: "doc-id-back",
      type: "Doc Type Copy Of Id Back",
      status: "DECLINED",
      expiresOn: "15 Mar 2023",
      reviewedBy: t("taskProfilePage.details.documentsTable.none"),
      submittedBy: t("taskProfilePage.details.documentsTable.client"),
      submittedOn: "14 Mar 2023 01:53:40",
      checkedOn: "09 Jan 2025 09:49:45",
    },
    {
      id: "doc-proof-front",
      type: "Doc Type Proof Of Address Front",
      status: "APPROVED",
      expiresOn: "15 Mar 2023",
      reviewedBy: t("taskProfilePage.details.documentsTable.none"),
      submittedBy: t("taskProfilePage.details.documentsTable.client"),
      submittedOn: "14 Mar 2023 01:53:40",
      checkedOn: "15 Mar 2023 06:39:03",
    },
    {
      id: "doc-proof-back",
      type: "Doc Type Proof Of Address Back",
      status: "APPROVED",
      expiresOn: "15 Mar 2023",
      reviewedBy: t("taskProfilePage.details.documentsTable.none"),
      submittedBy: t("taskProfilePage.details.documentsTable.client"),
      submittedOn: "14 Mar 2023 01:53:40",
      checkedOn: "15 Mar 2023 06:39:08",
    },
    {
      id: "doc-verification-1",
      type: "Doc Type Verification",
      status: "APPROVED",
      expiresOn: "-",
      reviewedBy: t("taskProfilePage.details.documentsTable.none"),
      submittedBy: t("taskProfilePage.details.documentsTable.client"),
      submittedOn: "-",
      checkedOn: "-",
    },
    {
      id: "doc-verification-2",
      type: "Doc Type Verification",
      status: "APPROVED",
      expiresOn: "-",
      reviewedBy: t("taskProfilePage.details.documentsTable.none"),
      submittedBy: t("taskProfilePage.details.documentsTable.client"),
      submittedOn: "-",
      checkedOn: "-",
    },
    {
      id: "doc-verification-3",
      type: "Doc Type Verification",
      status: "APPROVED",
      expiresOn: "-",
      reviewedBy: t("taskProfilePage.details.documentsTable.none"),
      submittedBy: t("taskProfilePage.details.documentsTable.client"),
      submittedOn: "-",
      checkedOn: "-",
    },
  ]), [t]);

  const utmRows = useMemo(() => [], []);

  const tradingAccountsRows = useMemo(() => ([
    { id: "2459271", type: "B5 2", balance: 0, equity: 0, credit: 0 },
    { id: "2955064", type: "P2P", balance: 0.92, equity: 0.92, credit: 0 },
    { id: "3381010", type: "Zero Standard", balance: 0, equity: 0, credit: 0 },
    { id: "2954568", type: "Standard 2", balance: 37072.6, equity: 42322.6, credit: 5250 },
    { id: "2107433", type: "B5 - MT5", balance: 0, equity: 0, credit: 0 },
    { id: "2909779", type: "B5 - MT5", balance: 0, equity: 0, credit: 0 },
    { id: "2059070", type: "B5 - MT5", balance: 0, equity: 0, credit: 0 },
    { id: "3300412", type: "P2P", balance: 0.11, equity: 0.11, credit: 0 },
    { id: "3011892", type: "B5 2", balance: 0, equity: 0, credit: 0 },
    { id: "2755884", type: "Standard 2", balance: 1025.5, equity: 1170.4, credit: 0 },
  ]), []);

  const emptyAccountSectionLabels = useMemo(() => ([
    t("taskProfilePage.accountsTasks.demoAccounts"),
    t("taskProfilePage.accountsTasks.investorAccounts"),
    t("taskProfilePage.accountsTasks.ibAccounts"),
    t("taskProfilePage.accountsTasks.mamAccounts"),
    t("taskProfilePage.accountsTasks.walletAccounts"),
  ]), [t]);

  const openTasksRows = useMemo(() => {
    return clientTasks
      .filter((task) => normalizeTaskStatusKey(task.status) !== "DONE")
      .sort((left, right) => {
        const leftDate = parseDateValue(left.created || left.createdAt || left.due || left.dueDate);
        const rightDate = parseDateValue(right.created || right.createdAt || right.due || right.dueDate);
        return (rightDate?.getTime() || 0) - (leftDate?.getTime() || 0);
      })
      .map((task) => ({
        id: `open-${task.id}`,
        taskId: task.id,
        type: getTaskTypeLabel(task.type),
        assignedTo: task.assignee?.name || "-",
        dateDue: formatDateTime(task.due || task.dueDate),
        status: t("taskProfilePage.accountsTasks.statusNew"),
        assignedBy: t("taskProfilePage.accountsTasks.assignedBySystem"),
        dateCreated: formatDateTime(task.created || task.createdAt),
      }));
  }, [clientTasks, formatDateTime, t]);

  const closedTasksRows = useMemo(() => {
    const computedRows = clientTasks
      .filter((task) => normalizeTaskStatusKey(task.status) === "DONE")
      .sort((left, right) => {
        const leftDate = parseDateValue(left.created || left.createdAt || left.due || left.dueDate);
        const rightDate = parseDateValue(right.created || right.createdAt || right.due || right.dueDate);
        return (rightDate?.getTime() || 0) - (leftDate?.getTime() || 0);
      })
      .map((task) => ({
        id: `closed-${task.id}`,
        taskId: task.id,
        type: getTaskTypeLabel(task.type),
        assignedTo: task.assignee?.name || "-",
        dateDue: formatDateTime(task.due || task.dueDate),
        status: t("taskProfilePage.accountsTasks.statusDone"),
        assignedBy: t("taskProfilePage.accountsTasks.assignedBySystem"),
        dateCreated: formatDateTime(task.created || task.createdAt),
      }));
      
    const dummyClosedTasks = [
      { id: "dummy-closed-1", type: "Funds Transfers", assignedTo: "Yousef Rajeb", dateDue: "27 Apr 2026 17:42", status: "DONE", assignedBy: "SYSTEM", dateCreated: "20 Apr 2026 16:42" },
      { id: "dummy-closed-2", type: "Funds Transfers", assignedTo: "Reham Skif", dateDue: "27 Apr 2026 02:44", status: "DONE", assignedBy: "SYSTEM", dateCreated: "20 Apr 2026 01:44" },
      { id: "dummy-closed-3", type: "Funds Transfers", assignedTo: "Muhammad Mlhem", dateDue: "24 Apr 2026 21:26", status: "DONE", assignedBy: "SYSTEM", dateCreated: "17 Apr 2026 20:26" },
      { id: "dummy-closed-4", type: "Funds Transfers", assignedTo: "Abdulmouttaleb Sameer", dateDue: "24 Apr 2026 16:46", status: "DONE", assignedBy: "SYSTEM", dateCreated: "17 Apr 2026 15:46" },
      { id: "dummy-closed-5", type: "Funds Transfers", assignedTo: "Aya zein", dateDue: "23 Apr 2026 16:28", status: "DONE", assignedBy: "SYSTEM", dateCreated: "16 Apr 2026 16:28" },
      { id: "dummy-closed-6", type: "Funds Transfers", assignedTo: "Sandra Rabah", dateDue: "22 Apr 2026 19:24", status: "DONE", assignedBy: "SYSTEM", dateCreated: "15 Apr 2026 19:24" },
      { id: "dummy-closed-7", type: "Funds Transfers", assignedTo: "Abdulmouttaleb Sameer", dateDue: "16 Apr 2026 18:28", status: "DONE", assignedBy: "SYSTEM", dateCreated: "09 Apr 2026 18:28" },
      { id: "dummy-closed-8", type: "Funds Transfers", assignedTo: "Muhammad Mlhem", dateDue: "09 Apr 2026 16:05", status: "DONE", assignedBy: "SYSTEM", dateCreated: "02 Apr 2026 16:05" },
      { id: "dummy-closed-9", type: "Funds Transfers", assignedTo: "Rawan hammoud", dateDue: "08 Apr 2026 16:31", status: "DONE", assignedBy: "SYSTEM", dateCreated: "01 Apr 2026 16:31" },
      { id: "dummy-closed-10", type: "Funds Transfers", assignedTo: "Yaseen Hmood", dateDue: "08 Apr 2026 15:32", status: "DONE", assignedBy: "SYSTEM", dateCreated: "01 Apr 2026 15:32" },
    ];
    
    return [...computedRows, ...dummyClosedTasks];
  }, [clientTasks, formatDateTime, t]);

  const lastLoginRelative = useMemo(
    () => formatRelativeFromNow(latestLoginLabel, locale, t),
    [latestLoginLabel, locale, t]
  );

  const summaryCards = useMemo(() => ([
    {
      id: "accounts",
      value: tradingAccountsRows.length,
      label: t("taskProfilePage.accountsTasks.summaryAccounts"),
      icon: "accounts",
    },
    {
      id: "open-tasks",
      value: openTasksRows.length,
      label: t("taskProfilePage.accountsTasks.summaryOpenTasks"),
      icon: "open-tasks",
    },
    {
      id: "closed-tasks",
      value: closedTasksRows.length,
      label: t("taskProfilePage.accountsTasks.summaryClosedTasks"),
      icon: "closed-tasks",
    },
    {
      id: "last-login",
      value: lastLoginRelative,
      label: t("taskProfilePage.accountsTasks.summaryLastLogin"),
      icon: "last-login",
    },
  ]), [closedTasksRows.length, lastLoginRelative, openTasksRows.length, t, tradingAccountsRows.length]);

  const cardInfoLeftRows = useMemo(() => ([
    {
      id: "full-name",
      label: t("taskProfilePage.card.fullName"),
      value: client?.name || "-",
    },
    {
      id: "email",
      label: t("taskProfilePage.card.email"),
      value: client?.email || "-",
    },
    {
      id: "phone",
      label: t("taskProfilePage.card.phoneNumber"),
      value: client?.phone || "-",
    },
    {
      id: "passport",
      label: t("taskProfilePage.card.passportNumber"),
      value: "-",
    },
  ]), [client, t]);

  const cardInfoRightRows = useMemo(() => {
    const cityLabel = addressParts[0] || "-";
    const stateLabel = addressParts[1] || cityLabel || "-";

    return [
      {
        id: "country",
        label: t("taskProfilePage.card.country"),
        value: getCountryCode(client?.country),
      },
      {
        id: "city",
        label: t("taskProfilePage.card.city"),
        value: cityLabel,
      },
      {
        id: "state-district",
        label: t("taskProfilePage.card.stateDistrict"),
        value: stateLabel,
      },
      {
        id: "kyc",
        label: t("taskProfilePage.card.kycApproved"),
        value: (
          <span className="inline-flex items-center rounded-md border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-200">
            {t("taskProfilePage.card.approved")}
          </span>
        ),
      },
    ];
  }, [addressParts, client, t]);

  const cardDocumentsRows = useMemo(() => [], []);

  const seededActivityNotes = useMemo(() => {
    const notes = clientTasks.flatMap((task) => {
      const timeline = Array.isArray(task.timeline) ? task.timeline : [];

      if (timeline.length === 0) {
        const fallbackDate = parseDateValue(task.created || task.createdAt) || new Date();

        return [
          {
            id: `seed-${task.id}`,
            note: t("taskProfilePage.notesAutoGenerated", { taskId: task.id }, `Task #${task.id} was created.`),
            actor: task.assignee?.name || t("common.system"),
            postedAt: fallbackDate.toISOString(),
          },
        ];
      }

      return timeline.map((entry, index) => {
        const fallbackDate = parseDateValue(task.created || task.createdAt) || new Date();
        const postedAt = parseDateValue(entry?.at) || fallbackDate;
        const noteValue = typeof entry?.note === "string" && entry.note.trim()
          ? entry.note.trim()
          : typeof entry?.title === "string" && entry.title.trim()
            ? entry.title.trim()
            : t("taskProfilePage.noAdditionalData");

        return {
          id: `seed-${task.id}-${index}`,
          note: noteValue,
          actor: task.assignee?.name || t("common.system"),
          postedAt: postedAt.toISOString(),
        };
      });
    });

    const dummyNotes = [
      {
        id: "dummy-1",
        note: "Client kickoff call awaiting confirmation.",
        actor: "Hadi Emad",
        postedAt: "2026-04-11T00:00:00.000Z",
      },
      {
        id: "dummy-2",
        note: "Onboarding checklist prepared.",
        actor: "Hadi Emad",
        postedAt: "2026-04-10T00:00:00.000Z",
      },
      {
        id: "dummy-3",
        note: "Initial contact email sent. Awaiting response.",
        actor: "Sara Ahmed",
        postedAt: "2026-04-09T14:30:00.000Z",
      },
      {
        id: "dummy-4",
        note: "Reviewed the submitted documents. Everything looks good so far but we need a better copy of the ID.",
        actor: "John Doe",
        postedAt: "2026-04-08T09:15:00.000Z",
      },
      {
        id: "dummy-5",
        note: "Left a voicemail since the client didn't pick up the phone.",
        actor: "Sara Ahmed",
        postedAt: "2026-04-08T11:45:00.000Z",
      },
      {
        id: "dummy-6",
        note: "Followed up regarding the ID submission. Client mentioned they will send it tomorrow.",
        actor: "Hadi Emad",
        postedAt: "2026-04-07T10:00:00.000Z",
      },
      {
        id: "dummy-7",
        note: "Account type changed to Premium based on client's recent request and deposit volume.",
        actor: "Sara Ahmed",
        postedAt: "2026-04-06T15:20:00.000Z",
      },
      {
        id: "dummy-8",
        note: "Sent a welcome email to introduce the new account manager. Awaiting response.",
        actor: "John Doe",
        postedAt: "2026-04-05T08:30:00.000Z",
      },
      {
        id: "dummy-9",
        note: "Client requested clarification on leverage settings. Replied with a detailed guide.",
        actor: "Hadi Emad",
        postedAt: "2026-04-04T12:45:00.000Z",
      },
      {
        id: "dummy-10",
        note: "Internal notes: Risk profile verified and approved by the compliance team.",
        actor: "Compliance Dept",
        postedAt: "2026-04-03T16:10:00.000Z",
      },
      {
        id: "dummy-11",
        note: "Initial account creation successful. Basic profile information updated.",
        actor: "System",
        postedAt: "2026-04-02T09:00:00.000Z",
      }
    ];

    const allNotes = [...dummyNotes, ...notes];

    return allNotes.sort((left, right) => {
      const leftDate = parseDateValue(left.postedAt);
      const rightDate = parseDateValue(right.postedAt);

      return (rightDate?.getTime() || 0) - (leftDate?.getTime() || 0);
    });
  }, [clientTasks, t]);

  const emailMessages = useMemo(() => {
    const rows = clientTasks.flatMap((task, index) => {
      const baseDate = parseDateValue(task.created || task.createdAt || task.due || task.dueDate) || new Date();
      const primaryDate = new Date(baseDate.getTime() + (index % 5) * 37000);
      const taskTypeLabel = getTaskTypeLabel(task.type);

      const primaryRow = {
        id: `mail-${task.id}-primary`,
        createdAt: primaryDate.toISOString(),
        from: EMAIL_SENDER,
        to: task.client?.email || client?.email || t("common.na"),
        subject: `${taskTypeLabel} ${t("taskProfilePage.emailSubjectSuffix")}`,
        emailType: toEmailTypeLabel(taskTypeLabel),
        sent: true,
      };

      const rowsForTask = [primaryRow];
      const normalizedStatus = String(task.status || "").trim().toUpperCase().replace(/\s+/g, "_");

      if (normalizedStatus === "DONE") {
        const followupDate = new Date(primaryDate.getTime() + 19000);

        rowsForTask.push({
          id: `mail-${task.id}-followup`,
          createdAt: followupDate.toISOString(),
          from: EMAIL_SENDER,
          to: task.client?.email || client?.email || t("common.na"),
          subject: `${taskTypeLabel} ${t("taskProfilePage.emailApprovedSuffix")}`,
          emailType: `${toEmailTypeLabel(taskTypeLabel)}_APPROVED`,
          sent: true,
        });
      }

      return rowsForTask;
    });

    const dummyEmails = [
      {
        id: "dummy-email-1",
        createdAt: "2026-04-12T14:20:00.000Z",
        from: EMAIL_SENDER,
        to: client?.email || "haider1.adnan1@gmail.com",
        subject: "Deposit Approved",
        emailType: "EMAIL_DEPOSIT_APPROVED",
        sent: true,
      },
      {
        id: "dummy-email-2",
        createdAt: "2026-04-12T10:15:00.000Z",
        from: EMAIL_SENDER,
        to: client?.email || "haider1.adnan1@gmail.com",
        subject: "Withdrawal Approved",
        emailType: "EMAIL_WITHDRAWAL_APPROVED",
        sent: true,
      },
      {
        id: "dummy-email-3",
        createdAt: "2026-04-11T16:45:00.000Z",
        from: EMAIL_SENDER,
        to: client?.email || "haider1.adnan1@gmail.com",
        subject: "Withdraw Funds",
        emailType: "EMAIL_WITHDRAWAL_REQUEST",
        sent: false,
      },
      {
        id: "dummy-email-4",
        createdAt: "2026-04-11T09:30:00.000Z",
        from: EMAIL_SENDER,
        to: client?.email || "haider1.adnan1@gmail.com",
        subject: "Request OTP for Withdrawal",
        emailType: "EMAIL_REQUEST_OTP",
        sent: true,
      },
      {
        id: "dummy-email-5",
        createdAt: "2026-04-10T11:00:00.000Z",
        from: EMAIL_SENDER,
        to: client?.email || "haider1.adnan1@gmail.com",
        subject: "Transfer Approved",
        emailType: "EMAIL_TRANSFER_APPROVED",
        sent: true,
      },
      {
        id: "dummy-email-6",
        createdAt: "2026-04-10T10:45:00.000Z",
        from: EMAIL_SENDER,
        to: client?.email || "haider1.adnan1@gmail.com",
        subject: "Transfer Request",
        emailType: "EMAIL_TRANSFER_REQUEST",
        sent: true,
      }
    ];

    const allRows = [...dummyEmails, ...rows];

    return allRows.sort((left, right) => {
      const leftDate = parseDateValue(left.createdAt);
      const rightDate = parseDateValue(right.createdAt);

      return (rightDate?.getTime() || 0) - (leftDate?.getTime() || 0);
    });
  }, [client, clientTasks, t]);

  const emailTypeOptions = useMemo(() => {
    const uniqueTypes = Array.from(new Set(emailMessages.map((item) => item.emailType)));
    return ["all", ...uniqueTypes];
  }, [emailMessages]);

  const filteredEmailMessages = useMemo(() => {
    if (emailTypeFilter === "all") {
      return emailMessages;
    }

    return emailMessages.filter((item) => item.emailType === emailTypeFilter);
  }, [emailMessages, emailTypeFilter]);

  const journalRows = useMemo(() => {
    const rows = clientTasks.flatMap((task) => {
      const timeline = Array.isArray(task.timeline) && task.timeline.length > 0
        ? task.timeline
        : [
          {
            title: t("common.taskCreated"),
            note: t("taskProfilePage.noAdditionalData"),
            at: task.created || task.createdAt,
          },
        ];

      return timeline.map((entry, index) => {
        const eventSource = entry?.title || task.status || t("common.event");
        const eventDate = parseDateValue(entry?.at || task.created || task.createdAt || task.due || task.dueDate) || new Date();

        return {
          id: `journal-${task.id}-${index}`,
          dateAt: eventDate.toISOString(),
          event: normalizeEventName(eventSource),
          taskLabel: t("taskProfilePage.taskOpenLabel"),
          payload: {
            taskId: task.id,
            clientId: task.client?.accountId || clientId || "",
            type: getTaskTypeLabel(task.type),
            status: task.status,
            event: eventSource,
            note: entry?.note || "",
          },
          ip: `82.199.${200 + (task.id % 30)}.${50 + index}`,
        };
      });
    });

    const dummyJournal = [
      {
        id: "dummy-journal-1",
        dateAt: "2026-04-12T14:20:00.000Z",
        event: "LOGIN",
        taskLabel: "SYSTEM_ACCESS",
        payload: {},
        ip: "45.153.119.20",
      },
      {
        id: "dummy-journal-2",
        dateAt: "2026-04-12T14:15:00.000Z",
        event: "LOGIN",
        taskLabel: "SYSTEM_ACCESS",
        payload: {},
        ip: "45.153.119.20",
      },
      {
        id: "dummy-journal-3",
        dateAt: "2026-04-12T09:30:00.000Z",
        event: "LOGIN",
        taskLabel: "SYSTEM_ACCESS",
        payload: {},
        ip: "45.153.119.20",
      },
      {
        id: "dummy-journal-4",
        dateAt: "2026-04-11T16:05:00.000Z",
        event: "TASK_CREATED",
        taskLabel: "Open Task",
        payload: {},
        ip: "45.153.119.20",
      },
      {
        id: "dummy-journal-5",
        dateAt: "2026-04-11T11:45:00.000Z",
        event: "LOGIN",
        taskLabel: "SYSTEM_ACCESS",
        payload: {},
        ip: "45.153.119.20",
      },
      {
        id: "dummy-journal-6",
        dateAt: "2026-04-10T10:00:00.000Z",
        event: "LOGIN",
        taskLabel: "SYSTEM_ACCESS",
        payload: {},
        ip: "45.153.119.20",
      }
    ];

    const allJournalRows = [...dummyJournal, ...rows];

    return allJournalRows
      .sort((left, right) => {
        const leftDate = parseDateValue(left.dateAt);
        const rightDate = parseDateValue(right.dateAt);

        return (rightDate?.getTime() || 0) - (leftDate?.getTime() || 0);
      })
      .slice(0, 80);
  }, [clientId, clientTasks, t]);

  const clientFingerprint = useMemo(() => {
    if (!client) {
      return "";
    }

    return `#${String(client.accountId || "").toLowerCase()}-${String(clientId || "").toLowerCase()}-profile`;
  }, [client, clientId]);

  useEffect(() => {
    setOpenTaskDetailsId(null);
    setNoteDraft("");
    setNoteError("");
    setEmailTypeFilter("all");
    setWorkspaceModal(null);
    setSelectedPayload(null);
    setLastResentEmailId(null);
    setIsV2Mode(false);
    setIsV3Mode(false);

    Object.values(v2LoadTimeoutsRef.current).forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });

    v2LoadTimeoutsRef.current = {};
    setV2OpenSections(createV2SectionState(false));
    setV2LoadedSections(createV2SectionState(false));
    setV2LoadingSections(createV2SectionState(false));
    setActivityNotes(seededActivityNotes);
  }, [clientId, seededActivityNotes]);

  useEffect(() => {
    return () => {
      Object.values(v2LoadTimeoutsRef.current).forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
    };
  }, []);

  useEffect(() => {
    if (!workspaceModal) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setWorkspaceModal(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [workspaceModal]);

  useEffect(() => {
    if (!workspaceModal) {
      return;
    }

    const targetSection = document.getElementById(`section-${workspaceModal}`);
    if (targetSection) {
      targetSection.scrollTop = 0;
    }
  }, [workspaceModal]);

  const handleShareNote = () => {
    const value = noteDraft.trim();

    if (!value) {
      setNoteError(t("taskProfilePage.noteRequired"));
      return;
    }

    const nextEntry = {
      id: `manual-note-${Date.now()}`,
      note: value,
      actor: t("common.system"),
      postedAt: new Date().toISOString(),
    };

    setActivityNotes((previous) => [nextEntry, ...previous]);
    setNoteDraft("");
    setNoteError("");
  };

  const handleExportJournal = () => {
    if (typeof window === "undefined" || !client) {
      return;
    }

    const headers = [
      t("taskProfilePage.date"),
      t("common.event"),
      t("common.task"),
      t("taskProfilePage.securityDetails"),
      t("taskProfilePage.ip"),
    ];

    const lines = [headers.map(csvEscape).join(",")];

    journalRows.forEach((row) => {
      lines.push([
        formatDateTime(row.dateAt),
        row.event,
        row.taskLabel,
        JSON.stringify(row.payload),
        row.ip,
      ].map(csvEscape).join(","));
    });

    const blob = new Blob([`${lines.join("\n")}\n`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${client.accountId || "client"}-journal.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleResendEmail = (emailId) => {
    setLastResentEmailId(emailId);
  };

  const v2LoadingLabel = isRtl
    ? "جاري تحميل بيانات القسم..."
    : "Loading section data...";

  if (!client) {
    return (
      <div className="min-h-screen bg-[#070f1d] py-10 px-4 sm:px-6 lg:px-8 text-slate-100">
        <div className="max-w-screen-xl mx-auto rounded-2xl border border-slate-700 bg-[#111a2c] p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-white">{t("taskProfilePage.notFoundTitle")}</h1>
          <p className="text-slate-300 mt-2">{t("taskProfilePage.notFoundDescription")}</p>
          <button
            type="button"
            onClick={() => navigate("/crm/tasks-v1/risk-management")}
            className="mt-5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
          >
            {t("taskProfilePage.backToTaskManagement")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070f1d] text-slate-100">
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5">
        <section className="relative rounded-2xl border border-slate-700/80 bg-gradient-to-b from-[#111a2c] to-[#0f1727] shadow-lg overflow-hidden">
          {/* Decorative Top Highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500"></div>

          {/* Profile Header Row */}
          <div className="px-5 sm:px-8 py-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            
            {/* Left side: Avatar & Info */}
            <div className="min-w-0 flex items-start gap-4 sm:gap-5">
              <div className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-inner ${client.color} ring-1 ring-white/10`}>
                {client.initials}
              </div>

              <div className="min-w-0 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-xl sm:text-3xl font-bold text-white leading-tight tracking-tight">{client.name}</h1>
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300 font-mono tracking-wider break-all shadow-sm">
                    {clientFingerprint}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-medium text-slate-300">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-sky-400">@</span>
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-emerald-400">📞</span>
                    <span>{client.phone || t("common.na")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-amber-400">🌍</span>
                    <span>{client.country || t("common.na")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Action Badges & Back Button */}
            <div className="flex flex-wrap items-center lg:justify-end gap-2 lg:max-w-md pt-1">
              <span className="px-2.5 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] uppercase font-bold tracking-wider shadow-sm backdrop-blur-sm">
                {t("taskProfilePage.badges.emailVerified")}
              </span>
              <span className="px-2.5 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] uppercase font-bold tracking-wider shadow-sm backdrop-blur-sm">
                {t("taskProfilePage.badges.kyc")}
              </span>
              <span className="px-2.5 py-1 rounded-md border border-sky-500/30 bg-sky-500/10 text-sky-300 text-[10px] uppercase font-bold tracking-wider shadow-sm backdrop-blur-sm">
                {t("taskProfilePage.badges.client")}
              </span>
              <span className="px-2.5 py-1 rounded-md border border-slate-600/50 bg-slate-800/50 text-slate-300 text-[10px] uppercase font-bold tracking-wider shadow-sm backdrop-blur-sm">
                {t("taskProfilePage.badges.lead")}
              </span>
              <span className="px-2.5 py-1 rounded-md border border-slate-600/50 bg-slate-800/50 text-slate-300 text-[10px] uppercase font-bold tracking-wider shadow-sm backdrop-blur-sm">
                {t("taskProfilePage.badges.trader")}
              </span>
              <button
                type="button"
                onClick={() => navigate("/crm/tasks-v1/risk-management")}
                aria-label={t("taskProfilePage.backToTaskManagement")}
                className="ml-1 md:ml-3 h-8 w-8 rounded-lg border border-slate-600/80 bg-slate-800 hover:bg-slate-700 hover:border-slate-500 text-slate-200 flex items-center justify-center transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              >
                {isRtl ? ">" : "<"}
              </button>
            </div>
          </div>

          {/* General Info Row */}
          {!isV3Mode ? (
          <div className="border-t border-slate-700/60 bg-black/20 px-5 sm:px-8 py-4 sm:py-5 flex flex-col xl:flex-row xl:items-stretch gap-6 backdrop-blur-sm">
            {/* Title block */}
            <div className="xl:w-1/4 shrink-0 flex items-center justify-between xl:flex-col xl:items-start xl:justify-center border-r-0 xl:border-r border-slate-700/50 xl:pr-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-sky-500 rounded-sm"></div>
                  <h2 className="text-xs sm:text-sm uppercase tracking-widest font-bold text-white">{t("taskProfilePage.details.generalInfo")}</h2>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1.5 font-medium leading-relaxed">
                  {isRtl ? "نظرة سريعة على البيانات الأساسية" : "Quick glance at core data"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceModal("details")}
                className="xl:hidden px-3 pt-1.5 pb-1 rounded-md border border-sky-500/60 bg-sky-500/15 text-sky-200 text-[11px] font-semibold hover:bg-sky-500/25 transition-colors shadow-sm"
              >
                {t("common.open")}
              </button>
            </div>

            {/* Grid of details */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-5">
              {headerProfileFacts.map((fact) => (
                <div key={fact.id} className="min-w-0 flex flex-col gap-1 justify-center relative group">
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-400/90 font-medium">{fact.label}</p>
                  <p className={`text-sm sm:text-[15px] font-semibold truncate ${fact.tone === "success" ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" : "text-slate-100"}`}>
                    {fact.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop Open Button */}
            <div className="hidden xl:flex items-center justify-end shrink-0 pl-4">
              <button
                type="button"
                onClick={() => setWorkspaceModal("details")}
                className="px-4 py-2 rounded-lg border border-sky-500/60 bg-sky-500/10 text-sky-300 hover:text-white text-xs font-semibold hover:bg-sky-500/30 hover:border-sky-400 transition-all shadow-[0_0_15px_rgba(14,165,233,0.15)] flex items-center gap-2"
              >
                <span>{t("common.open", "Open")}</span>
                <span className="text-[10px] leading-none opacity-70">↗</span>
              </button>
            </div>
          </div>
          ) : (
          <div className="border-t border-slate-700/60 bg-black/20 px-5 sm:px-8 py-5 sm:py-6 flex flex-col gap-8 backdrop-blur-sm">
            <div className="flex flex-col xl:flex-row gap-8">
              
              {/* V3 General Info block */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-4 bg-sky-500 rounded-sm"></div>
                  <h2 className="text-sm sm:text-base uppercase tracking-widest font-bold text-white">{t("taskProfilePage.details.generalInfo")}</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#0f1727]/50 rounded-xl p-4 border border-slate-700/50 shadow-inner">
                  {headerProfileFacts.map((fact) => (
                    <div key={fact.id} className="min-w-0 flex flex-col gap-1 relative group">
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-400/90 font-medium">{fact.label}</p>
                      <p className={`text-sm sm:text-[14px] font-semibold break-words ${fact.tone === "success" ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" : "text-slate-100"}`}>
                        {fact.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* V3 Experience Info block */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-sm"></div>
                  <h2 className="text-sm sm:text-base uppercase tracking-widest font-bold text-white">{t("taskProfilePage.details.experienceInfo")}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-[#0f1727]/50 rounded-xl p-4 border border-slate-700/50 shadow-inner">
                  {[...experienceInfoLeftRows, ...experienceInfoRightRows].map((row) => (
                    <div key={row.id} className="min-w-0 flex flex-col gap-1 relative group">
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-400/90 font-medium">{row.label}</p>
                      <p className="text-sm sm:text-[14px] font-semibold text-slate-100 break-words">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* V3 Additional Info block */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-4 bg-purple-500 rounded-sm"></div>
                  <h2 className="text-sm sm:text-base uppercase tracking-widest font-bold text-white">{t("taskProfilePage.details.additionalInfo")}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-[#0f1727]/50 rounded-xl p-4 border border-slate-700/50 shadow-inner">
                  {[...additionalInfoLeftRows, ...additionalInfoRightRows].map((row) => (
                    <div key={row.id} className="min-w-0 flex flex-col gap-1 relative group">
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-400/90 font-medium">{row.label}</p>
                      <p className="text-sm sm:text-[14px] font-semibold text-slate-100 break-words">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-700 bg-[#111a2c] shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-700/80">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t("taskProfilePage.tabs.overview")}</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mt-1">{t("taskProfilePage.accountSnapshot")}</h2>
            <p className="text-sm text-slate-300 mt-1">
              {isRtl
                ? "الأقسام الأساسية ظاهرة مباشرة. باقي الأقسام المتقدمة تقدر تفتحها من أزرار الـ popup أسفل الصفحة."
                : "Core sections are visible directly. Open the remaining advanced sections from the popup buttons below."}
            </p>
          </div>

          <div className={`p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 ${isV3Mode && !isV3NoteAccordionOpen && !isV3TradingAccountsOpen ? "h-max" : "lg:h-[700px] xl:h-[750px]"}`}>
            
            {/* Left Column: Activity, Emails & Journal */}
            <section className={`lg:col-span-7 rounded-xl border border-slate-700 bg-[#0f1727] p-4 flex flex-col overflow-hidden ${isV3Mode && !isV3NoteAccordionOpen ? "h-max self-start" : "h-full"}`}>
              <div 
                className={`flex flex-wrap items-center justify-between gap-3 shrink-0 ${isV3Mode ? `cursor-pointer hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition-colors select-none ${isV3NoteAccordionOpen ? "mb-2" : ""}` : "mb-3"}`}
                onClick={isV3Mode ? () => setIsV3NoteAccordionOpen(!isV3NoteAccordionOpen) : undefined}
              >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-sky-500 rounded-full"></div>
                    <h3 className="text-sm uppercase tracking-wide font-semibold text-white">{t("taskProfilePage.postNoteTitle")}</h3>
                  </div>
                  {isV3Mode && (
                    <svg className={`w-5 h-5 text-slate-400 transition-transform ${isV3NoteAccordionOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>

                {(!isV3Mode || isV3NoteAccordionOpen) && (
                  <>
                    <div className="flex flex-col gap-3">
                      <textarea
                        value={noteDraft}
                        onChange={(event) => {
                          setNoteDraft(event.target.value);
                          if (noteError) setNoteError("");
                        }}
                        rows={2}
                        placeholder={t("taskProfilePage.postNotePlaceholder")}
                        className="w-full rounded-md border border-slate-600 bg-[#111a2c] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500/70 resize-none"
                      />

                      <div className="flex items-center justify-between shrink-0">
                        <p className="text-[11px] text-rose-300 min-h-[16px]">{noteError || " "}</p>
                        <button
                          type="button"
                          onClick={handleShareNote}
                          className="px-4 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold tracking-wide transition-colors"
                        >
                          {t("taskProfilePage.shareInternally")}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 border-t border-slate-700/60 pt-4 max-h-[500px] xl:max-h-[650px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                      {activityNotes.length === 0 ? (
                        <p className="text-xs text-slate-400">{t("taskProfilePage.activityEmpty")}</p>
                      ) : (
                        activityNotes.map((entry) => (
                          <article key={entry.id} className="rounded-md bg-[#162133] border border-slate-700 px-3 py-2 border-l-[3px] border-l-blue-500">
                            <p className="text-sm text-slate-200 leading-relaxed font-medium">{entry.note}</p>
                            <div className="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
                              <span className="font-semibold text-slate-300">{entry.actor}</span>
                              <span>•</span>
                              <span>{formatDateTime(entry.postedAt)}</span>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </>
                )}
              </section>

            {/* Right Column: Accounts Stack */}
            <section className={`lg:col-span-5 rounded-xl border border-slate-700 bg-[#0f1727] p-4 flex flex-col overflow-hidden ${isV3Mode && !isV3TradingAccountsOpen ? "h-max self-start" : "h-full"}`}>
              <div 
                className={`flex flex-wrap items-center justify-between gap-3 shrink-0 ${isV3Mode ? `cursor-pointer hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition-colors select-none ${isV3TradingAccountsOpen ? "mb-2" : ""}` : "mb-3"}`}
                onClick={isV3Mode ? () => setIsV3TradingAccountsOpen(!isV3TradingAccountsOpen) : undefined}
              >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
                    <h3 className="text-sm uppercase tracking-wide font-semibold text-white">{t("taskProfilePage.accountsTasks.tradingAccounts")}</h3>
                  </div>
                  {isV3Mode && (
                    <svg className={`w-5 h-5 text-slate-400 transition-transform ${isV3TradingAccountsOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>

                {(!isV3Mode || isV3TradingAccountsOpen) && (
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="space-y-2.5 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent custom-scrollbar flex-1 min-h-[150px]">
                    {tradingAccountsRows.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">{t("taskProfilePage.accountsTasks.noAccountsFound")}</p>
                    ) : (
                      tradingAccountsRows.map((row) => (
                        <div key={row.id} className="flex items-center justify-between rounded-md bg-[#162133] px-3 py-2 border border-slate-700/50">
                          <div className="flex flex-col shrink-0 pr-2">
                            <span className="text-xs font-bold text-sky-300">#{row.id}</span>
                            <span className="text-[10px] text-slate-400 uppercase mt-0.5">{row.type}</span>
                          </div>
                          <div className="flex flex-col items-end shrink-0 pl-2 border-l border-slate-700">
                            <span className="text-xs font-semibold text-white">{formatCurrencyAmount(row.balance, locale)}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">{t("taskProfilePage.accountsTasks.equity")}: {formatCurrencyAmount(row.equity, locale)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Additional Accounts Accordion Group inside Trading Accounts section */}
                  <div className="mt-4 border-t border-slate-700/80 pt-4 shrink-0">
                    <div className="rounded-xl border border-slate-700 bg-[#0f1727] shadow-sm overflow-hidden flex flex-col">
                      <div className="divide-y divide-slate-700/60 max-h-[300px] overflow-y-auto custom-scrollbar">
                    
                        {/* Demo Accounts */}
                        <details className="group">
                          <summary className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#162133] transition-colors [&::-webkit-details-marker]:hidden select-none outline-none">
                            <div className="flex items-center gap-2.5">
                              <div className="w-1.5 h-3.5 bg-emerald-400 rounded-full"></div>
                              <span className="text-sm font-semibold tracking-wide text-slate-200">Demo Accounts</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="bg-slate-700/60 text-slate-300 font-bold text-[10px] px-2.5 py-0.5 rounded border border-slate-600/50">0</span>
                              <svg className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </summary>
                          <div className="px-4 py-5 bg-[#0a101a] flex flex-col items-center justify-center text-center border-t border-slate-700/50 shadow-inner">
                            <svg className="w-6 h-6 text-slate-500 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-xs text-slate-400">{t("taskProfilePage.accountsTasks.noAccountsFound") || "No accounts found."}</p>
                          </div>
                        </details>

                        {/* Investor Accounts */}
                        <details className="group">
                          <summary className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#162133] transition-colors [&::-webkit-details-marker]:hidden select-none outline-none">
                            <div className="flex items-center gap-2.5">
                              <div className="w-1.5 h-3.5 bg-blue-500 rounded-full"></div>
                              <span className="text-sm font-semibold tracking-wide text-slate-200">Investor Accounts</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="bg-slate-700/60 text-slate-300 font-bold text-[10px] px-2.5 py-0.5 rounded border border-slate-600/50">0</span>
                              <svg className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </summary>
                          <div className="px-4 py-5 bg-[#0a101a] flex flex-col items-center justify-center text-center border-t border-slate-700/50 shadow-inner">
                            <svg className="w-6 h-6 text-slate-500 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-xs text-slate-400">{t("taskProfilePage.accountsTasks.noAccountsFound") || "No accounts found."}</p>
                          </div>
                        </details>

                        {/* IB Accounts */}
                        <details className="group">
                          <summary className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#162133] transition-colors [&::-webkit-details-marker]:hidden select-none outline-none">
                            <div className="flex items-center gap-2.5">
                              <div className="w-1.5 h-3.5 bg-amber-500 rounded-full"></div>
                              <span className="text-sm font-semibold tracking-wide text-slate-200">IB Accounts</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="bg-slate-700/60 text-slate-300 font-bold text-[10px] px-2.5 py-0.5 rounded border border-slate-600/50">0</span>
                              <svg className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </summary>
                          <div className="px-4 py-5 bg-[#0a101a] flex flex-col items-center justify-center text-center border-t border-slate-700/50 shadow-inner">
                            <svg className="w-6 h-6 text-slate-500 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-xs text-slate-400">{t("taskProfilePage.accountsTasks.noAccountsFound") || "No accounts found."}</p>
                          </div>
                        </details>

                        {/* MAM Accounts */}
                        <details className="group">
                          <summary className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#162133] transition-colors [&::-webkit-details-marker]:hidden select-none outline-none">
                            <div className="flex items-center gap-2.5">
                              <div className="w-1.5 h-3.5 bg-rose-500 rounded-full"></div>
                              <span className="text-sm font-semibold tracking-wide text-slate-200">MAM Accounts</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="bg-slate-700/60 text-slate-300 font-bold text-[10px] px-2.5 py-0.5 rounded border border-slate-600/50">0</span>
                              <svg className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </summary>
                          <div className="px-4 py-5 bg-[#0a101a] flex flex-col items-center justify-center text-center border-t border-slate-700/50 shadow-inner">
                            <svg className="w-6 h-6 text-slate-500 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-xs text-slate-400">{t("taskProfilePage.accountsTasks.noAccountsFound") || "No accounts found."}</p>
                          </div>
                        </details>

                        {/* Wallet Accounts */}
                        <details className="group">
                          <summary className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#162133] transition-colors [&::-webkit-details-marker]:hidden select-none outline-none">
                            <div className="flex items-center gap-2.5">
                              <div className="w-1.5 h-3.5 bg-indigo-500 rounded-full"></div>
                              <span className="text-sm font-semibold tracking-wide text-slate-200">Wallet Accounts</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="bg-slate-700/60 text-slate-300 font-bold text-[10px] px-2.5 py-0.5 rounded border border-slate-600/50">0</span>
                              <svg className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </summary>
                          <div className="px-4 py-5 bg-[#0a101a] flex flex-col items-center justify-center text-center border-t border-slate-700/50 shadow-inner">
                            <svg className="w-6 h-6 text-slate-500 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-xs text-slate-400">{t("taskProfilePage.accountsTasks.noAccountsFound") || "No accounts found."}</p>
                          </div>
                        </details>

                      </div>
                    </div>
                  </div>

                </div>
                )}
            </section>
          </div>

        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className={`rounded-2xl border border-slate-700 bg-white dark:bg-[#111a2c] shadow-sm p-4 sm:p-5 flex flex-col xl:col-span-1 ${isV3Mode && !isV3DocumentsOpen ? "h-max self-start" : "xl:h-[500px]"}`}>
            <div 
              className={`flex flex-row items-center justify-between gap-3 shrink-0 ${isV3Mode ? `cursor-pointer hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition-colors select-none ${isV3DocumentsOpen ? "mb-4" : ""}` : "mb-4"}`}
              onClick={isV3Mode ? () => setIsV3DocumentsOpen(!isV3DocumentsOpen) : undefined}
            >
              <h2 className="text-[17px] font-bold text-slate-800 dark:text-white">{t("taskProfilePage.details.documents")}</h2>
              {isV3Mode && (
                <svg className={`w-5 h-5 text-slate-400 transition-transform ${isV3DocumentsOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
            {(!isV3Mode || isV3DocumentsOpen) && (
            <div className="overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 dark:border-slate-700 custom-scrollbar flex-1 min-h-0">
              <table className="w-full text-xs sm:text-[13px] leading-snug">
                <thead className="bg-slate-100 dark:bg-[#1b2942] text-slate-600 dark:text-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wide text-[11px] sm:text-xs">{t("taskProfilePage.details.documentsTable.type")}</th>
                    <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wide text-[11px] sm:text-xs">{t("taskProfilePage.details.documentsTable.status")}</th>
                    <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wide text-[11px] sm:text-xs hidden sm:table-cell">{t("taskProfilePage.details.documentsTable.expiresOn")}</th>
                    <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wide text-[11px] sm:text-xs hidden md:table-cell">{t("taskProfilePage.details.documentsTable.reviewedBy")}</th>
                    <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wide text-[11px] sm:text-xs hidden lg:table-cell">{t("taskProfilePage.details.documentsTable.submittedBy")}</th>
                    <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wide text-[11px] sm:text-xs hidden xl:table-cell">{t("taskProfilePage.details.documentsTable.submittedOn")}</th>
                    <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wide text-[11px] sm:text-xs hidden 2xl:table-cell">{t("taskProfilePage.details.documentsTable.checkedOn")}</th>
                    <th className="px-2 py-2.5 text-center font-bold uppercase tracking-wide text-[11px] sm:text-xs w-[80px]">{t("taskProfilePage.details.documentsTable.actions")}</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#0f1727] divide-y divide-slate-200 dark:divide-slate-700/70">
                  {detailsDocuments.map((row) => {
                    const statusLabel = row.status === "APPROVED"
                      ? t("taskProfilePage.details.documentsTable.approved")
                      : row.status === "DECLINED"
                        ? t("taskProfilePage.details.documentsTable.declined")
                        : row.status;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-[#19273d] transition-colors break-words">
                        <td className="px-2 py-2 text-slate-800 dark:text-white font-medium max-w-[100px]">{row.type}</td>
                        <td className={`px-2 py-2 font-bold ${getDocumentStatusTone(row.status)} whitespace-nowrap`}>{statusLabel}</td>
                        <td className="px-2 py-2 text-slate-600 dark:text-slate-300 hidden sm:table-cell">{row.expiresOn}</td>
                        <td className="px-2 py-2 text-slate-600 dark:text-slate-300 hidden md:table-cell">{row.reviewedBy}</td>
                        <td className="px-2 py-2 text-slate-600 dark:text-slate-300 hidden lg:table-cell">{row.submittedBy}</td>
                        <td className="px-2 py-2 text-slate-600 dark:text-slate-300 hidden xl:table-cell">{row.submittedOn}</td>
                        <td className="px-2 py-2 text-slate-600 dark:text-slate-300 hidden 2xl:table-cell">{row.checkedOn}</td>
                        <td className="px-2 py-2 text-center align-middle">
                          <div className="flex items-center justify-center gap-1.5 min-w-[70px]">
                            <button
                              type="button"
                              className="h-8 w-8 rounded border border-sky-500/60 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25 inline-flex items-center justify-center transition-colors"
                              aria-label={t("common.view")}
                              title={t("common.view")}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="h-8 w-8 rounded border border-emerald-500/60 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 inline-flex items-center justify-center transition-colors"
                              aria-label="Video"
                              title="Video"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="23 7 16 12 23 17 23 7" />
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )}
          </section>

          {/* Tasks Container */}
          <section className={`rounded-2xl border border-slate-700 bg-white dark:bg-[#111a2c] shadow-sm flex flex-col xl:col-span-1 overflow-hidden ${isV3Mode && !isV3ClosedTasksOpen && !isV3OpenTasksOpen ? "h-max self-start" : "xl:h-[500px]"}`}>
            {/* Open Tasks */}
            <details className="group p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-transparent" open={!isV3Mode || isV3OpenTasksOpen} onClick={(e) => {
              if (isV3Mode) {
                e.preventDefault();
                setIsV3OpenTasksOpen(!isV3OpenTasksOpen);
              }
            }}>
              <summary className="flex items-center justify-between text-[#5c468a] dark:text-[#a68de3] cursor-pointer list-none [&::-webkit-details-marker]:hidden shrink-0 select-none">
                <div className="flex items-center">
                  <svg className="w-[18px] h-[18px] ltr:mr-2 rtl:ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </svg>
                  <h2 className="text-[17px] font-bold">Open Tasks</h2>
                </div>
                <div className="flex items-center text-slate-400 dark:text-slate-500">
                  <svg className={`w-5 h-5 transition-transform duration-200 ${(!isV3Mode || isV3OpenTasksOpen) ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              {(!isV3Mode || isV3OpenTasksOpen) && (
              <div className="mt-4 bg-[#e0f8fa] dark:bg-[#0c2a33] border border-[#b2e1e7] dark:border-[#1a5b6c] text-[#006e7d] dark:text-[#6ec5d3] p-3 sm:px-4 sm:py-3.5 rounded flex items-center justify-center text-sm font-medium shadow-sm">
                <svg className="w-[18px] h-[18px] ltr:mr-2 rtl:ml-2 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
                No tasks found.
              </div>
              )}
            </details>

            {/* Closed Tasks */}
            <div className="p-4 sm:p-5 flex flex-col flex-1 min-h-0 bg-white dark:bg-[#0a101a]/30">
              <div 
                className={`flex items-center text-slate-800 dark:text-white shrink-0 ${isV3Mode ? `cursor-pointer hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition-colors select-none ${isV3ClosedTasksOpen ? "mb-4" : ""}` : "mb-4"}`}
                onClick={isV3Mode ? () => setIsV3ClosedTasksOpen(!isV3ClosedTasksOpen) : undefined}
              >
                <svg className="w-[18px] h-[18px] ltr:mr-2 rtl:ml-2 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                </svg>
                <h2 className="text-[17px] font-bold flex-1">Closed Tasks</h2>
                {isV3Mode && (
                  <svg className={`w-5 h-5 text-slate-400 transition-transform ${isV3ClosedTasksOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            
              {(!isV3Mode || isV3ClosedTasksOpen) && (
              <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner custom-scrollbar">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-3 font-bold">TYPE</th>
                      <th className="px-3 py-3 font-bold">ASSIGNED TO</th>
                      <th className="px-3 py-3 font-bold">DATE DUE</th>
                      <th className="px-3 py-3 font-bold text-center">STATUS</th>
                      <th className="px-3 py-3 font-bold">ASSIGNED BY</th>
                      <th className="px-3 py-3 font-bold">DATE CREATED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50 bg-white dark:bg-[#0f1727]">
                    {closedTasksRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-[#19273d] transition-colors">
                        <td className="px-3 py-3 text-sky-600 dark:text-sky-400 font-semibold">{row.type}</td>
                        <td className="px-3 py-3 text-slate-700 dark:text-slate-100 font-medium">{row.assignedTo}</td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{row.dateDue}</td>
                        <td className="px-3 py-3 text-center w-[120px]">
                          <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-emerald-700 dark:text-emerald-400">
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{row.assignedBy}</td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{row.dateCreated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </section>

          <section className={`rounded-2xl border border-slate-700 bg-[#111a2c] shadow-sm p-4 sm:p-5 flex flex-col xl:col-span-2 ${isV3Mode && !isV3EmailMessagesOpen ? "h-max self-start" : ""}`}>
            <div 
              className={`flex flex-col xl:flex-row xl:items-center justify-between gap-3 shrink-0 ${isV3Mode ? `cursor-pointer hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition-colors select-none ${isV3EmailMessagesOpen ? "mb-4" : ""}` : "mb-4"}`}
              onClick={isV3Mode ? () => setIsV3EmailMessagesOpen(!isV3EmailMessagesOpen) : undefined}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{t("taskProfilePage.emailMessages")}</h2>
                {isV3Mode && (
                  <svg className={`w-5 h-5 text-slate-400 transition-transform ${isV3EmailMessagesOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>

              {(!isV3Mode || isV3EmailMessagesOpen) && (
              <select
                value={emailTypeFilter}
                onChange={(event) => setEmailTypeFilter(event.target.value)}
                className="w-full xl:w-auto min-w-[200px] rounded-lg border border-slate-600 bg-[#0f1727] text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70"
                onClick={(e) => isV3Mode && e.stopPropagation()}
              >
                {emailTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? t("taskProfilePage.showAllEmails") : option}
                  </option>
                ))}
              </select>
              )}
            </div>

            {(!isV3Mode || isV3EmailMessagesOpen) && (
            <div className="overflow-auto rounded-xl border border-slate-700 max-h-[400px] custom-scrollbar flex-1">
              <table className="w-full text-sm min-w-[980px]">
                <thead className="bg-[#1b2942] text-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.createdAt")}</th>
                    <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.from")}</th>
                    <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.to")}</th>
                    <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.subject")}</th>
                    <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.emailType")}</th>
                    <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.sent")}</th>
                    <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.resendEmail")}</th>
                  </tr>
                </thead>
                <tbody className="bg-[#0f1727] divide-y divide-slate-700/70">
                  {filteredEmailMessages.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-7 text-center text-slate-300">
                        {t("taskProfilePage.emailRowsEmpty")}
                      </td>
                    </tr>
                  ) : (
                    filteredEmailMessages.map((row) => (
                      <tr key={row.id} className="hover:bg-[#19273d] transition-colors">
                        <td className="px-3 py-2.5 text-slate-200 whitespace-nowrap">{formatDateTime(row.createdAt)}</td>
                        <td className="px-3 py-2.5 text-slate-100 truncate max-w-[120px]" title={row.from}>{row.from}</td>
                        <td className="px-3 py-2.5 text-sky-300 truncate max-w-[120px]" title={row.to}>{row.to}</td>
                        <td className="px-3 py-2.5 text-slate-100 truncate max-w-[150px]" title={row.subject}>{row.subject}</td>
                        <td className="px-3 py-2.5 text-slate-300">{row.emailType}</td>
                        <td className="px-3 py-2.5 text-slate-100">{row.sent ? t("taskProfilePage.yes") : t("common.na")}</td>
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => handleResendEmail(row.id)}
                            className={`px-2.5 py-1 rounded border text-xs font-semibold transition-colors ${
                              lastResentEmailId === row.id
                                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200"
                                : "border-sky-500/60 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25"
                            }`}
                          >
                            {lastResentEmailId === row.id ? t("taskProfilePage.resent") : t("taskProfilePage.resend")}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            )}
          </section>

          <section className={`rounded-2xl border border-slate-700 bg-[#111a2c] shadow-sm p-4 sm:p-5 flex flex-col xl:col-span-2 ${isV3Mode && !isV3ClientJournalOpen ? "h-max self-start" : ""}`}>
            <div 
              className={`flex flex-row items-center justify-between gap-3 shrink-0 ${isV3Mode ? `cursor-pointer hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition-colors select-none ${isV3ClientJournalOpen ? "mb-4" : ""}` : "mb-4"}`}
              onClick={isV3Mode ? () => setIsV3ClientJournalOpen(!isV3ClientJournalOpen) : undefined}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{t("taskProfilePage.clientJournal")}</h2>
                {isV3Mode && (
                  <svg className={`w-5 h-5 text-slate-400 transition-transform ${isV3ClientJournalOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
              {(!isV3Mode || isV3ClientJournalOpen) && (
              <button
                type="button"
                onClick={(e) => {
                  if (isV3Mode) e.stopPropagation();
                  handleExportJournal();
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shrink-0"
              >
                {t("taskProfilePage.export")}
              </button>
              )}
            </div>

            {(!isV3Mode || isV3ClientJournalOpen) && (
            <div className="overflow-auto rounded-xl border border-slate-700 max-h-[400px] custom-scrollbar flex-1">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-[#1b2942] text-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.date")}</th>
                    <th className="px-3 py-2.5 text-left font-semibold">{t("common.event")}</th>
                    <th className="px-3 py-2.5 text-left font-semibold">{t("common.task")}</th>
                    <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.securityDetails")}</th>
                    <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.ip")}</th>
                  </tr>
                </thead>
                <tbody className="bg-[#0f1727] divide-y divide-slate-700/70">
                  {journalRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-7 text-center text-slate-300">
                        {t("taskProfilePage.journalRowsEmpty")}
                      </td>
                    </tr>
                  ) : (
                    journalRows.map((row) => (
                      <tr key={row.id} className="hover:bg-[#19273d] transition-colors">
                        <td className="px-3 py-2.5 text-slate-200 whitespace-nowrap">{formatDateTime(row.dateAt)}</td>
                        <td className="px-3 py-2.5 text-slate-100">{row.event}</td>
                        <td className="px-3 py-2.5 text-slate-100">{row.taskLabel}</td>
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => setSelectedPayload(row)}
                            className="px-2.5 py-1 rounded border border-sky-500/60 bg-sky-500/15 text-sky-200 text-xs font-semibold hover:bg-sky-500/25"
                          >
                            {t("taskProfilePage.seePayload")}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">{row.ip}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            )}
          </section>
        </div>

        {!isV3Mode && (
        <section className="rounded-2xl border border-slate-700 bg-[#111a2c] shadow-sm p-4 sm:p-5 mt-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-1">Workspace</p>
              <h2 className="text-lg sm:text-xl font-bold text-white">Control Center Launchpad</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-sm md:text-right">
              {isRtl
                ? "الوصول السريع والكامل لبيانات مساحة العمل المتقدمة."
                : "Quick access to all advanced workspace details."}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setWorkspaceModal("activity")}
              className="group flex flex-col items-start p-3 sm:p-4 rounded-xl border border-slate-700 bg-[#0f1727] hover:bg-[#162133] hover:border-sky-500/50 transition-all text-start"
            >
              <div className="w-10 h-10 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-400 mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors">{t("taskProfilePage.viewTabs.activity")}</h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{t("taskProfilePage.recentActivityDescription")}</p>
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceModal("details")}
              className="group flex flex-col items-start p-3 sm:p-4 rounded-xl border border-slate-700 bg-[#0f1727] hover:bg-[#162133] hover:border-emerald-500/50 transition-all text-start"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">{t("taskProfilePage.viewTabs.details")}</h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{t("taskProfilePage.detailsTabDescription")}</p>
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceModal("accounts")}
              className="group flex flex-col items-start p-3 sm:p-4 rounded-xl border border-slate-700 bg-[#0f1727] hover:bg-[#162133] hover:border-purple-500/50 transition-all text-start"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">{t("taskProfilePage.viewTabs.accountsAndTasks")}</h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{t("taskProfilePage.accountsTasksDescription")}</p>
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceModal("card")}
              className="group flex flex-col items-start p-3 sm:p-4 rounded-xl border border-slate-700 bg-[#0f1727] hover:bg-[#162133] hover:border-amber-500/50 transition-all text-start"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">{t("taskProfilePage.viewTabs.card")}</h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{t("taskProfilePage.cardTabDescription")}</p>
            </button>
          </div>
        </section>
        )}

        <section className="hidden">
          <nav className="flex flex-wrap items-center gap-2" aria-label="Profile sections">
            <a href="#section-activity" className="px-3 py-1.5 rounded-md border border-slate-600 text-slate-100 text-sm font-semibold hover:bg-slate-700/50">
              {t("taskProfilePage.viewTabs.activity")}
            </a>
            <a href="#section-details" className="px-3 py-1.5 rounded-md border border-slate-600 text-slate-100 text-sm font-semibold hover:bg-slate-700/50">
              {t("taskProfilePage.viewTabs.details")}
            </a>
            <a href="#section-accounts" className="px-3 py-1.5 rounded-md border border-slate-600 text-slate-100 text-sm font-semibold hover:bg-slate-700/50">
              {t("taskProfilePage.viewTabs.accountsAndTasks")}
            </a>
            <a href="#section-card" className="px-3 py-1.5 rounded-md border border-slate-600 text-slate-100 text-sm font-semibold hover:bg-slate-700/50">
              {t("taskProfilePage.viewTabs.card")}
            </a>
          </nav>
        </section>

        <section id="section-activity" className={workspaceModal === "activity" ? "fixed inset-0 z-[70] overflow-y-auto bg-slate-950/80 backdrop-blur-sm px-4 sm:px-6 py-6 sm:py-10 flex items-start justify-center transition-all duration-300" : "hidden"}>
          <div className="w-full max-w-screen-xl space-y-4 rounded-2xl border border-slate-700 bg-[#070f1d] p-3 sm:p-5 shadow-[0_0_50px_-12px_rgba(0,0,0,0.7)] relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setWorkspaceModal(null)}
              className="absolute top-5 right-5 rtl:right-auto rtl:left-5 z-10 p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-rose-600 transition-colors shadow-lg"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="rounded-xl border border-slate-700 bg-[#111a2c] p-4 sm:p-6 shadow-sm pr-14 rtl:pr-4 rtl:pl-14">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">{t("taskProfilePage.viewTabs.activity")}</p>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">{t("taskProfilePage.recentActivity")}</h2>
                  <p className="text-sm text-slate-300 mt-1.5 max-w-2xl">{t("taskProfilePage.recentActivityDescription")}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1.5 rounded-md border border-slate-600 bg-[#0f1727] text-slate-200 font-medium">{activityNotes.length} Notes</span>
                  <span className="px-3 py-1.5 rounded-md border border-slate-600 bg-[#0f1727] text-slate-200 font-medium">{emailMessages.length} Emails</span>
                  <span className="px-3 py-1.5 rounded-md border border-slate-600 bg-[#0f1727] text-slate-200 font-medium">{journalRows.length} Journal Logs</span>
                </div>
              </div>
            </div>

            <section className="rounded-2xl border border-slate-700 bg-[#111a2c] p-4 sm:p-5 shadow-sm space-y-3">
              <h2 className="text-xl font-semibold text-white">{t("taskProfilePage.postNoteTitle")}</h2>
              <textarea
                value={noteDraft}
                onChange={(event) => {
                  setNoteDraft(event.target.value);
                  if (noteError) {
                    setNoteError("");
                  }
                }}
                rows={3}
                placeholder={t("taskProfilePage.postNotePlaceholder")}
                className="w-full rounded-lg border border-slate-600 bg-[#0f1727] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
              />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-rose-300 min-h-[16px]">{noteError || " "}</p>
                <button
                  type="button"
                  onClick={handleShareNote}
                  className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold"
                >
                  {t("taskProfilePage.shareInternally")}
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-700 bg-[#111a2c] p-3 sm:p-4 shadow-sm">
              {activityNotes.length === 0 ? (
                <p className="text-sm text-slate-300">{t("taskProfilePage.activityEmpty")}</p>
              ) : (
                <div className="space-y-2.5">
                  {activityNotes.map((entry) => (
                    <article key={entry.id} className="rounded-lg border border-slate-700 bg-[#0f1727] px-3.5 py-3 border-l-4 border-l-blue-500">
                      <p className="text-sm text-slate-100 leading-relaxed">{entry.note}</p>
                      <div className="mt-1.5 text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>{entry.actor}</span>
                        <span className="text-slate-500">|</span>
                        <span>{formatDateTime(entry.postedAt)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-700 bg-[#111a2c] p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h2 className="text-2xl font-semibold text-white">{t("taskProfilePage.emailMessages")}</h2>

                <select
                  value={emailTypeFilter}
                  onChange={(event) => setEmailTypeFilter(event.target.value)}
                  className="min-w-[230px] rounded-lg border border-slate-600 bg-[#0f1727] text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/70"
                >
                  {emailTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? t("taskProfilePage.showAllEmails") : option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-auto rounded-xl border border-slate-700">
                <table className="w-full text-sm min-w-[980px]">
                  <thead className="bg-[#1b2942] text-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.createdAt")}</th>
                      <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.from")}</th>
                      <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.to")}</th>
                      <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.subject")}</th>
                      <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.emailType")}</th>
                      <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.sent")}</th>
                      <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.resendEmail")}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#0f1727] divide-y divide-slate-700/70">
                    {filteredEmailMessages.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-7 text-center text-slate-300">
                          {t("taskProfilePage.emailRowsEmpty")}
                        </td>
                      </tr>
                    ) : (
                      filteredEmailMessages.map((row) => (
                        <tr key={row.id} className="hover:bg-[#19273d] transition-colors">
                          <td className="px-3 py-2.5 text-slate-200 whitespace-nowrap">{formatDateTime(row.createdAt)}</td>
                          <td className="px-3 py-2.5 text-slate-100">{row.from}</td>
                          <td className="px-3 py-2.5 text-sky-300">{row.to}</td>
                          <td className="px-3 py-2.5 text-slate-100">{row.subject}</td>
                          <td className="px-3 py-2.5 text-slate-300">{row.emailType}</td>
                          <td className="px-3 py-2.5 text-slate-100">{row.sent ? t("taskProfilePage.yes") : t("common.na")}</td>
                          <td className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => handleResendEmail(row.id)}
                              className={`px-2.5 py-1 rounded border text-xs font-semibold transition-colors ${
                                lastResentEmailId === row.id
                                  ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200"
                                  : "border-sky-500/60 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25"
                              }`}
                            >
                              {lastResentEmailId === row.id ? t("taskProfilePage.resent") : t("taskProfilePage.resend")}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-700 bg-[#111a2c] p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-2xl font-semibold text-white">{t("taskProfilePage.clientJournal")}</h2>
                <button
                  type="button"
                  onClick={handleExportJournal}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
                >
                  {t("taskProfilePage.export")}
                </button>
              </div>

              <div className="overflow-auto rounded-xl border border-slate-700">
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="bg-[#1b2942] text-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.date")}</th>
                      <th className="px-3 py-2.5 text-left font-semibold">{t("common.event")}</th>
                      <th className="px-3 py-2.5 text-left font-semibold">{t("common.task")}</th>
                      <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.securityDetails")}</th>
                      <th className="px-3 py-2.5 text-left font-semibold">{t("taskProfilePage.ip")}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#0f1727] divide-y divide-slate-700/70">
                    {journalRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-7 text-center text-slate-300">
                          {t("taskProfilePage.journalRowsEmpty")}
                        </td>
                      </tr>
                    ) : (
                      journalRows.map((row) => (
                        <tr key={row.id} className="hover:bg-[#19273d] transition-colors">
                          <td className="px-3 py-2.5 text-slate-200 whitespace-nowrap">{formatDateTime(row.dateAt)}</td>
                          <td className="px-3 py-2.5 text-slate-100">{row.event}</td>
                          <td className="px-3 py-2.5 text-slate-100">{row.taskLabel}</td>
                          <td className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => setSelectedPayload(row)}
                              className="px-2.5 py-1 rounded border border-sky-500/60 bg-sky-500/15 text-sky-200 text-xs font-semibold hover:bg-sky-500/25"
                            >
                              {t("taskProfilePage.seePayload")}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">{row.ip}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>

        <section id="section-details" className={workspaceModal === "details" ? "fixed inset-0 z-[70] overflow-y-auto bg-slate-950/80 backdrop-blur-sm px-4 sm:px-6 py-6 flex items-center justify-center transition-all duration-300" : "hidden"}>
          <div className="w-full max-w-4xl rounded-2xl border border-slate-700/60 bg-[#0f1727] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-700/60 bg-gradient-to-r from-[#141e30] to-[#0f1727] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-wide">{t("taskProfilePage.detailsTabTitle", "Account Details")}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{t("taskProfilePage.detailsTabDescription", "View detailed experience and additional information.")}</p>
                </div>
              </div>
              <button 
                onClick={() => setWorkspaceModal(null)}
                className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/80 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gradient-to-b from-[#111a2c]/40 to-[#0f1727] custom-scrollbar">
              
              {/* General Info Warning */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3.5 items-start relative overflow-hidden shadow-sm">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 border border-amber-500/30">
                  <span className="font-bold text-xs font-mono">i</span>
                </div>
                <div className="pt-0.5">
                  <h3 className="text-[15px] font-semibold text-amber-400 leading-tight">General Info</h3>
                  <p className="text-sm text-amber-500/80 mt-1">Changes made here will update on Trading Platform(s)</p>
                </div>
              </div>

              {/* Experience Info */}
              <section className="space-y-4">
                <DetailsSectionHeader title={t("taskProfilePage.details.experienceInfo")} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailsKeyValueTable rows={experienceInfoLeftRows} />
                  <DetailsKeyValueTable rows={experienceInfoRightRows} />
                </div>
              </section>

              {/* Additional Info */}
              <section className="space-y-4">
                <DetailsSectionHeader title={t("taskProfilePage.details.additionalInfo")} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailsKeyValueTable rows={additionalInfoLeftRows} />
                  <DetailsKeyValueTable rows={additionalInfoRightRows} />
                </div>
              </section>

            </div>
          </div>
        </section>

        <section id="section-accounts" className={workspaceModal === "accounts" ? "fixed inset-0 z-[70] overflow-y-auto bg-slate-950/80 backdrop-blur-sm px-4 sm:px-6 py-6 sm:py-10 flex items-start justify-center transition-all duration-300" : "hidden"}>
          <div className="w-full max-w-screen-xl space-y-4 rounded-2xl border border-slate-700 bg-[#070f1d] p-3 sm:p-5 shadow-[0_0_50px_-12px_rgba(0,0,0,0.7)] relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setWorkspaceModal(null)}
              className="absolute top-5 right-5 rtl:right-auto rtl:left-5 z-10 p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-rose-600 transition-colors shadow-lg"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="rounded-xl border border-slate-700 bg-[#111a2c] p-4 sm:p-6 shadow-sm pr-14 rtl:pr-4 rtl:pl-14">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">{t("taskProfilePage.viewTabs.accountsAndTasks")}</p>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{t("taskProfilePage.accountsTasksTitle")}</h2>
              <p className="text-sm text-slate-300 mt-1.5 max-w-2xl">{t("taskProfilePage.accountsTasksDescription")}</p>
            </div>

            <section className="rounded-2xl border border-slate-700 bg-[#111a2c] p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-violet-200" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2.5a4 4 0 100 8 4 4 0 000-8zM3 16.2a7 7 0 1114 0V17H3v-.8z" />
                </svg>
                <h2 className="text-[32px] leading-tight font-semibold text-white">{t("taskProfilePage.accountsTasks.accounts")}</h2>
              </div>

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-slate-700/80 bg-[#0f1727] overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700/80 text-lg font-semibold text-slate-100">
                    {t("taskProfilePage.accountsTasks.tradingAccounts")}
                  </div>

                  <div className="overflow-auto">
                    <table className="w-full min-w-[880px] text-sm">
                      <thead className="bg-[#18243a] text-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.accountsTasks.accountNumber")}</th>
                          <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("common.type")}</th>
                          <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.accountsTasks.balance")}</th>
                          <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.accountsTasks.equity")}</th>
                          <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.accountsTasks.credit")}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-[#0f1727] divide-y divide-slate-700/70">
                        {tradingAccountsRows.map((row) => (
                          <tr key={row.id} className="hover:bg-[#19273d] transition-colors">
                            <td className="px-4 py-3">
                              <button type="button" className="text-sky-300 hover:text-sky-200 font-semibold">
                                #{row.id}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-slate-200">{row.type}</td>
                            <td className="px-4 py-3 text-white font-semibold">{formatCurrencyAmount(row.balance, locale)}</td>
                            <td className="px-4 py-3 text-slate-300">{formatCurrencyAmount(row.equity, locale)}</td>
                            <td className="px-4 py-3 text-slate-300">{formatCurrencyAmount(row.credit, locale)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {emptyAccountSectionLabels.map((title) => (
                    <article key={title} className="rounded-xl border border-slate-700/80 bg-[#0f1727] overflow-hidden shadow-sm">
                      <header className="px-4 py-3 border-b border-slate-700/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-7 w-7 rounded-full border border-cyan-300/30 bg-cyan-500/10 text-cyan-200 text-xs font-bold inline-flex items-center justify-center shrink-0">
                            i
                          </span>
                          <h4 className="text-sm font-semibold text-slate-100 truncate">{title}</h4>
                        </div>

                        <span className="inline-flex items-center rounded-md border border-slate-600/70 bg-[#152036] px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                          0
                        </span>
                      </header>

                      <div className="p-4">
                        <div className="min-h-[92px] rounded-lg border border-dashed border-cyan-400/30 bg-[#111a2c] px-3 py-4 text-center flex flex-col items-center justify-center gap-2">
                          <span className="h-8 w-8 rounded-full border border-cyan-300/40 bg-cyan-500/10 text-cyan-100 text-sm font-bold inline-flex items-center justify-center">
                            i
                          </span>
                          <p className="text-sm font-medium text-cyan-100">{t("taskProfilePage.accountsTasks.noAccountsFound")}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-700 bg-[#111a2c] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/80 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.5 16h15v1.5h-15V16zm1-2.5h2v2h-2v-2zm4-4h2v6h-2v-6zm4-3h2v9h-2V6.5zm4 1.5h2v7.5h-2V8z" />
                </svg>
                <h3 className="text-[30px] leading-tight font-semibold text-white">{t("taskProfilePage.accountsTasks.summary")}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700/70">
                {summaryCards.map((card) => (
                  <div key={card.id} className="px-6 py-5 flex items-center gap-3">
                    <span className="h-8 w-8 rounded-full border border-slate-600/70 bg-[#1a2438] text-slate-200 text-xs font-semibold inline-flex items-center justify-center">
                      {card.icon === "accounts" ? "A" : card.icon === "open-tasks" ? "O" : card.icon === "closed-tasks" ? "C" : "L"}
                    </span>
                    <div>
                      <p className="text-3xl font-semibold text-white leading-none">{card.value}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-400 mt-1">{card.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-700 bg-[#111a2c] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/80 flex items-center gap-2">
                <svg className="w-4 h-4 text-violet-200" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 2.5h8l3 3v12H3v-15h3zm1.5 1.5v3h5V4H7.5zm2.5 6h2v5h-2v-5z" />
                </svg>
                <h3 className="text-[30px] leading-tight font-semibold text-white">{t("taskProfilePage.accountsTasks.openTasks")}</h3>
              </div>

              <div className="overflow-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="bg-[#18243a] text-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("common.type")}</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.accountsTasks.assignedTo")}</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.accountsTasks.dateDue")}</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("common.status")}</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.accountsTasks.assignedBy")}</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.accountsTasks.dateCreated")}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#0f1727] divide-y divide-slate-700/70">
                    {openTasksRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-300">{t("taskProfilePage.accountsTasks.noTasksData")}</td>
                      </tr>
                    ) : (
                      openTasksRows.map((row) => (
                        <tr key={row.id} className="hover:bg-[#19273d] transition-colors">
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setOpenTaskDetailsId(row.taskId)}
                              className="text-sky-300 hover:text-sky-200 font-semibold text-left"
                            >
                              {row.type}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-slate-200">{row.assignedTo}</td>
                          <td className="px-4 py-3 text-slate-300">{row.dateDue}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2.5 py-1 rounded-md border border-blue-500/40 bg-blue-500/20 text-blue-200 text-xs font-bold uppercase tracking-wide">
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2.5 py-1 rounded-md border border-slate-500/40 bg-slate-500/20 text-slate-200 text-xs font-bold uppercase tracking-wide">
                              {row.assignedBy}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{row.dateCreated}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-700 bg-[#111a2c] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/80 flex items-center gap-2">
                <svg className="w-4 h-4 text-violet-200" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7.5 13.5L4 10l1.4-1.4 2.1 2.1 7.1-7.1L16 5l-8.5 8.5z" />
                </svg>
                <h3 className="text-[30px] leading-tight font-semibold text-white">{t("taskProfilePage.accountsTasks.closedTasks")}</h3>
              </div>

              <div className="overflow-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="bg-[#18243a] text-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("common.type")}</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.accountsTasks.assignedTo")}</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.accountsTasks.dateDue")}</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("common.status")}</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.accountsTasks.assignedBy")}</th>
                      <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.accountsTasks.dateCreated")}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#0f1727] divide-y divide-slate-700/70">
                    {closedTasksRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-300">{t("taskProfilePage.accountsTasks.noTasksData")}</td>
                      </tr>
                    ) : (
                      closedTasksRows.map((row) => (
                        <tr key={row.id} className="hover:bg-[#19273d] transition-colors">
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setOpenTaskDetailsId(row.taskId)}
                              className="text-sky-300 hover:text-sky-200 font-semibold text-left"
                            >
                              {row.type}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-slate-200">{row.assignedTo}</td>
                          <td className="px-4 py-3 text-slate-300">{row.dateDue}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2.5 py-1 rounded-md border border-emerald-500/40 bg-emerald-500/20 text-emerald-200 text-xs font-bold uppercase tracking-wide">
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2.5 py-1 rounded-md border border-slate-500/40 bg-slate-500/20 text-slate-200 text-xs font-bold uppercase tracking-wide">
                              {row.assignedBy}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{row.dateCreated}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>

        <section id="section-card" className={workspaceModal === "card" ? "fixed inset-0 z-[70] overflow-y-auto bg-slate-950/80 backdrop-blur-sm px-4 sm:px-6 py-6 sm:py-10 flex items-start justify-center transition-all duration-300" : "hidden"}>
          <div className="w-full max-w-screen-xl space-y-4 rounded-2xl border border-slate-700 bg-[#070f1d] p-3 sm:p-5 shadow-[0_0_50px_-12px_rgba(0,0,0,0.7)] relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setWorkspaceModal(null)}
              className="absolute top-5 right-5 rtl:right-auto rtl:left-5 z-10 p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-rose-600 transition-colors shadow-lg"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="rounded-xl border border-slate-700 bg-[#111a2c] p-4 sm:p-6 shadow-sm pr-14 rtl:pr-4 rtl:pl-14">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">{t("taskProfilePage.viewTabs.card")}</p>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{t("taskProfilePage.cardTabTitle")}</h2>
              <p className="text-sm text-slate-300 mt-1.5 max-w-2xl">{t("taskProfilePage.cardTabDescription")}</p>
            </div>

          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-700 bg-[#111a2c] p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-slate-200" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M3 5.5A1.5 1.5 0 014.5 4h11A1.5 1.5 0 0117 5.5v9a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 14.5v-9zm3 .5a1 1 0 100 2 1 1 0 000-2zm3 0a1 1 0 000 2h6a1 1 0 100-2H9zm-3 4a1 1 0 000 2h9a1 1 0 100-2H6z" />
                  </svg>
                  <h2 className="text-[30px] leading-tight font-semibold text-white">
                    {t("taskProfilePage.card.cardHeader", { name: client?.name || "-" }, `INZO Card - ${client?.name || "-"}`)}
                  </h2>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/40 bg-rose-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-rose-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-300" />
                  {t("taskProfilePage.card.accountNotOpened")}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <DetailsKeyValueTable rows={cardInfoLeftRows} />
                <DetailsKeyValueTable rows={cardInfoRightRows} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-700 bg-[#111a2c] p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M5 2.75A1.75 1.75 0 003.25 4.5v11A1.75 1.75 0 005 17.25h10A1.75 1.75 0 0016.75 15.5V7.06a1.75 1.75 0 00-.51-1.24l-2.56-2.56A1.75 1.75 0 0012.44 2.75H5zm7 .94l2.81 2.81H12V3.69z" />
                </svg>
                <h3 className="text-[30px] leading-tight font-semibold text-white">{t("taskProfilePage.card.documents")}</h3>
              </div>

              <div className="mt-4 overflow-auto rounded-xl border border-slate-700/70">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="bg-[#18243a] text-slate-200">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.details.documentsTable.type")}</th>
                      <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.details.documentsTable.status")}</th>
                      <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.details.documentsTable.expiresOn")}</th>
                      <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.details.documentsTable.reviewedBy")}</th>
                      <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.details.documentsTable.submittedBy")}</th>
                      <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.details.documentsTable.submittedOn")}</th>
                      <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.details.documentsTable.checkedOn")}</th>
                      <th className="px-3 py-3 text-center font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.details.documentsTable.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/70 bg-[#0f1727]">
                    {cardDocumentsRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="h-14" />
                      </tr>
                    ) : (
                      cardDocumentsRows.map((row) => {
                        const statusLabel = row.status === "APPROVED"
                          ? t("taskProfilePage.details.documentsTable.approved")
                          : row.status === "DECLINED"
                            ? t("taskProfilePage.details.documentsTable.declined")
                            : row.status;

                        return (
                          <tr key={row.id}>
                            <td className="px-3 py-3 text-slate-100">{row.type}</td>
                            <td className={`px-3 py-3 font-semibold ${getDocumentStatusTone(row.status)}`}>{statusLabel}</td>
                            <td className="px-3 py-3 text-slate-300">{row.expiresOn}</td>
                            <td className="px-3 py-3 text-slate-300">{row.reviewedBy}</td>
                            <td className="px-3 py-3 text-slate-300">{row.submittedBy}</td>
                            <td className="px-3 py-3 text-slate-300">{row.submittedOn}</td>
                            <td className="px-3 py-3 text-slate-300">{row.checkedOn}</td>
                            <td className="px-3 py-3 text-center">
                              <button
                                type="button"
                                className="inline-flex items-center rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700/50"
                              >
                                {t("common.view")}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          </div>
        </section>
      </main>

      <div className={`fixed top-4 ${isRtl ? "left-4" : "right-4"} z-[95] flex items-center gap-2`}>
        <button
          type="button"
          onClick={handleToggleV2Mode}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold tracking-wide shadow-lg transition-colors ${
            isV2Mode
              ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30"
              : "border-slate-500/70 bg-[#111a2c] text-slate-100 hover:bg-slate-700/70"
          }`}
        >
          <span>V2</span>
          <span className="rounded border border-current/40 px-1.5 py-0.5 text-[10px]">
            {isV2Mode ? (isRtl ? "مفعل" : "ON") : (isRtl ? "غير مفعل" : "OFF")}
          </span>
        </button>
        <button
          type="button"
          onClick={handleToggleV3Mode}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold tracking-wide shadow-lg transition-colors ${
            isV3Mode
              ? "border-purple-500/60 bg-purple-500/20 text-purple-100 hover:bg-purple-500/30"
              : "border-slate-500/70 bg-[#111a2c] text-slate-100 hover:bg-slate-700/70"
          }`}
        >
          <span>V3</span>
          <span className="rounded border border-current/40 px-1.5 py-0.5 text-[10px]">
            {isV3Mode ? (isRtl ? "مفعل" : "ON") : (isRtl ? "غير مفعل" : "OFF")}
          </span>
        </button>
      </div>

      {isV2Mode ? (
        <section className="fixed inset-0 z-[80] overflow-y-auto bg-[#020617]/95 backdrop-blur-sm px-4 sm:px-6 py-16">
          <div className="max-w-screen-2xl mx-auto space-y-3">
            <div className="rounded-xl border border-slate-700/80 bg-[#0f1727] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">V2</p>
              <h2 className="text-xl sm:text-2xl font-semibold text-white mt-1">
                {isRtl ? "وضع المدير - الأقسام التفاعلية" : "Manager Mode - Section Accordion"}
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                {isRtl
                  ? "افتح أي قسم لتحميل بياناته فقط، بدون تحميل باقي الأقسام دفعة واحدة."
                  : "Open any section to load only its data without loading all sections at once."}
              </p>
            </div>

            <V2AccordionSection
              title={t("taskProfilePage.viewTabs.details")}
              subtitle={isRtl ? "البيانات الأساسية والخبرة والمعلومات الإضافية" : "General info, experience, and additional info"}
              isStatic={true}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <DetailsKeyValueTable rows={generalInfoLeftRows} />
                  <DetailsKeyValueTable rows={generalInfoRightRows} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <DetailsKeyValueTable rows={experienceInfoLeftRows} />
                  <DetailsKeyValueTable rows={experienceInfoRightRows} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <DetailsKeyValueTable rows={additionalInfoLeftRows} />
                  <DetailsKeyValueTable rows={additionalInfoRightRows} />
                </div>
              </div>
            </V2AccordionSection>

            <V2AccordionSection
              title={t("taskProfilePage.viewTabs.activity")}
              subtitle={isRtl ? "الملاحظات والنشاط الداخلي" : "Internal notes and activity feed"}
              isOpen={v2OpenSections.activity}
              isLoading={v2LoadingSections.activity}
              isLoaded={v2LoadedSections.activity}
              onToggle={() => handleToggleV2Section("activity")}
              loadingLabel={v2LoadingLabel}
            >
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <textarea
                    value={noteDraft}
                    onChange={(event) => {
                      setNoteDraft(event.target.value);
                      if (noteError) {
                        setNoteError("");
                      }
                    }}
                    rows={3}
                    placeholder={t("taskProfilePage.postNotePlaceholder")}
                    className="w-full rounded-lg border border-slate-600 bg-[#111a2c] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] text-rose-300 min-h-[16px]">{noteError || " "}</p>
                    <button
                      type="button"
                      onClick={handleShareNote}
                      className="px-4 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                    >
                      {t("taskProfilePage.shareInternally")}
                    </button>
                  </div>
                </div>

                <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {activityNotes.length === 0 ? (
                    <p className="text-sm text-slate-300">{t("taskProfilePage.activityEmpty")}</p>
                  ) : (
                    activityNotes.map((entry) => (
                      <article key={entry.id} className="rounded-md border border-slate-700 bg-[#162133] px-3 py-2 border-l-[3px] border-l-blue-500">
                        <p className="text-sm text-slate-100">{entry.note}</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {entry.actor} • {formatDateTime(entry.postedAt)}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </V2AccordionSection>

            <V2AccordionSection
              title={t("taskProfilePage.viewTabs.accountsAndTasks")}
              subtitle={isRtl ? "الحسابات المفتوحة ومهام العميل" : "Client accounts and tasks"}
              isOpen={v2OpenSections.accounts}
              isLoading={v2LoadingSections.accounts}
              isLoaded={v2LoadedSections.accounts}
              onToggle={() => handleToggleV2Section("accounts")}
              loadingLabel={v2LoadingLabel}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {summaryCards.map((card) => (
                    <div key={card.id} className="rounded-lg border border-slate-700 bg-[#111a2c] px-3 py-2.5">
                      <p className="text-xs uppercase tracking-wide text-slate-400">{card.label}</p>
                      <p className="text-lg font-semibold text-white mt-1">{card.value}</p>
                    </div>
                  ))}
                </div>

                <div className="overflow-auto rounded-lg border border-slate-700">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-[#1b2942] text-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">{t("taskProfilePage.accountsTasks.accountNumber")}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t("common.type")}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t("taskProfilePage.accountsTasks.balance")}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t("taskProfilePage.accountsTasks.equity")}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#0f1727] divide-y divide-slate-700/70">
                      {tradingAccountsRows.map((row) => (
                        <tr key={row.id}>
                          <td className="px-3 py-2 text-sky-300">#{row.id}</td>
                          <td className="px-3 py-2 text-slate-200">{row.type}</td>
                          <td className="px-3 py-2 text-white">{formatCurrencyAmount(row.balance, locale)}</td>
                          <td className="px-3 py-2 text-slate-300">{formatCurrencyAmount(row.equity, locale)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-700 bg-[#111a2c] p-3">
                    <h4 className="text-sm font-semibold text-white mb-2">{t("taskProfilePage.accountsTasks.openTasks")}</h4>
                    {openTasksRows.length === 0 ? (
                      <p className="text-xs text-slate-400">{t("taskProfilePage.accountsTasks.noTasksData")}</p>
                    ) : (
                      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                        {openTasksRows.slice(0, 10).map((row) => (
                          <button
                            key={row.id}
                            type="button"
                            onClick={() => setOpenTaskDetailsId(row.taskId)}
                            className="w-full rounded-md border border-slate-700 bg-[#0f1727] px-2.5 py-2 text-left hover:bg-[#19273d]"
                          >
                            <p className="text-sm text-sky-300 font-semibold truncate">{row.type}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{row.assignedTo} • {row.dateDue}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-slate-700 bg-[#111a2c] p-3">
                    <h4 className="text-sm font-semibold text-white mb-2">{t("taskProfilePage.accountsTasks.closedTasks")}</h4>
                    {closedTasksRows.length === 0 ? (
                      <p className="text-xs text-slate-400">{t("taskProfilePage.accountsTasks.noTasksData")}</p>
                    ) : (
                      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                        {closedTasksRows.slice(0, 10).map((row) => (
                          <button
                            key={row.id}
                            type="button"
                            onClick={() => setOpenTaskDetailsId(row.taskId)}
                            className="w-full rounded-md border border-slate-700 bg-[#0f1727] px-2.5 py-2 text-left hover:bg-[#19273d]"
                          >
                            <p className="text-sm text-sky-300 font-semibold truncate">{row.type}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{row.assignedTo} • {row.dateDue}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </V2AccordionSection>

            <V2AccordionSection
              title={t("taskProfilePage.emailMessages")}
              subtitle={isRtl ? "المراسلات المرتبطة بالعميل" : "Client email communication"}
              isOpen={v2OpenSections.emails}
              isLoading={v2LoadingSections.emails}
              isLoaded={v2LoadedSections.emails}
              onToggle={() => handleToggleV2Section("emails")}
              loadingLabel={v2LoadingLabel}
            >
              <div className="space-y-3">
                <div className="flex justify-end">
                  <select
                    value={emailTypeFilter}
                    onChange={(event) => setEmailTypeFilter(event.target.value)}
                    className="w-full sm:w-auto min-w-[220px] rounded-lg border border-slate-600 bg-[#111a2c] text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                  >
                    {emailTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === "all" ? t("taskProfilePage.showAllEmails") : option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="overflow-auto rounded-lg border border-slate-700">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead className="bg-[#1b2942] text-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">{t("taskProfilePage.createdAt")}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t("taskProfilePage.from")}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t("taskProfilePage.to")}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t("taskProfilePage.subject")}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t("taskProfilePage.emailType")}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t("taskProfilePage.sent")}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#0f1727] divide-y divide-slate-700/70">
                      {filteredEmailMessages.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-slate-300">{t("taskProfilePage.emailRowsEmpty")}</td>
                        </tr>
                      ) : (
                        filteredEmailMessages.map((row) => (
                          <tr key={row.id} className="hover:bg-[#19273d]">
                            <td className="px-3 py-2 text-slate-200 whitespace-nowrap">{formatDateTime(row.createdAt)}</td>
                            <td className="px-3 py-2 text-slate-100">{row.from}</td>
                            <td className="px-3 py-2 text-sky-300">{row.to}</td>
                            <td className="px-3 py-2 text-slate-100">{row.subject}</td>
                            <td className="px-3 py-2 text-slate-300">{row.emailType}</td>
                            <td className="px-3 py-2 text-slate-100">{row.sent ? t("taskProfilePage.yes") : t("common.na")}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </V2AccordionSection>

            <V2AccordionSection
              title={t("taskProfilePage.clientJournal")}
              subtitle={isRtl ? "سجل الأحداث الأمنية والتنفيذية" : "Security and operational event log"}
              isOpen={v2OpenSections.journal}
              isLoading={v2LoadingSections.journal}
              isLoaded={v2LoadedSections.journal}
              onToggle={() => handleToggleV2Section("journal")}
              loadingLabel={v2LoadingLabel}
            >
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleExportJournal}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
                  >
                    {t("taskProfilePage.export")}
                  </button>
                </div>

                <div className="overflow-auto rounded-lg border border-slate-700">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-[#1b2942] text-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">{t("taskProfilePage.date")}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t("common.event")}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t("common.task")}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t("taskProfilePage.securityDetails")}</th>
                        <th className="px-3 py-2 text-left font-semibold">{t("taskProfilePage.ip")}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#0f1727] divide-y divide-slate-700/70">
                      {journalRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-slate-300">{t("taskProfilePage.journalRowsEmpty")}</td>
                        </tr>
                      ) : (
                        journalRows.map((row) => (
                          <tr key={row.id} className="hover:bg-[#19273d]">
                            <td className="px-3 py-2 text-slate-200 whitespace-nowrap">{formatDateTime(row.dateAt)}</td>
                            <td className="px-3 py-2 text-slate-100">{row.event}</td>
                            <td className="px-3 py-2 text-slate-100">{row.taskLabel}</td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => setSelectedPayload(row)}
                                className="px-2.5 py-1 rounded border border-sky-500/60 bg-sky-500/15 text-sky-200 text-xs font-semibold hover:bg-sky-500/25"
                              >
                                {t("taskProfilePage.seePayload")}
                              </button>
                            </td>
                            <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{row.ip}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </V2AccordionSection>

            <V2AccordionSection
              title={t("taskProfilePage.viewTabs.card")}
              subtitle={isRtl ? "تفاصيل البطاقة وحالة الحساب" : "Card details and account status"}
              isOpen={v2OpenSections.card}
              isLoading={v2LoadingSections.card}
              isLoaded={v2LoadedSections.card}
              onToggle={() => handleToggleV2Section("card")}
              loadingLabel={v2LoadingLabel}
              colorClass="bg-amber-500"
            >
              <div className="space-y-4">
                <section className="rounded-2xl border border-slate-700 bg-[#111a2c] p-4 sm:p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-slate-200" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M3 5.5A1.5 1.5 0 014.5 4h11A1.5 1.5 0 0117 5.5v9a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 14.5v-9zm3 .5a1 1 0 100 2 1 1 0 000-2zm3 0a1 1 0 000 2h6a1 1 0 100-2H9zm-3 4a1 1 0 000 2h9a1 1 0 100-2H6z" />
                      </svg>
                      <h2 className="text-[24px] leading-tight font-semibold text-white">
                        {t("taskProfilePage.card.cardHeader", { name: client?.name || "-" }, `INZO Card - ${client?.name || "-"}`)}
                      </h2>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/40 bg-rose-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-rose-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-300" />
                      {t("taskProfilePage.card.accountNotOpened")}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <DetailsKeyValueTable rows={cardInfoLeftRows} />
                    <DetailsKeyValueTable rows={cardInfoRightRows} />
                  </div>
                </section>
              </div>
            </V2AccordionSection>

            <V2AccordionSection
              title={t("taskProfilePage.card.documents")}
              subtitle={isRtl ? "مراجعة المستندات والمرفقات" : "Review documents and attachments"}
              isOpen={v2OpenSections.documents}
              isLoading={v2LoadingSections.documents}
              isLoaded={v2LoadedSections.documents}
              onToggle={() => handleToggleV2Section("documents")}
              loadingLabel={v2LoadingLabel}
              colorClass="bg-rose-500"
            >
              <div className="overflow-auto rounded-xl border border-slate-700/70">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="bg-[#18243a] text-slate-200">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.details.documentsTable.type")}</th>
                      <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.details.documentsTable.status")}</th>
                      <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.details.documentsTable.expiresOn")}</th>
                      <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.details.documentsTable.reviewedBy")}</th>
                      <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.details.documentsTable.submittedBy")}</th>
                      <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.details.documentsTable.submittedOn")}</th>
                      <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.details.documentsTable.checkedOn")}</th>
                      <th className="px-3 py-3 text-center font-semibold uppercase tracking-wide text-xs">{t("taskProfilePage.details.documentsTable.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/70 bg-[#0f1727]">
                    {detailsDocuments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="h-14" />
                      </tr>
                    ) : (
                      detailsDocuments.map((row) => {
                        const statusLabel = row.status === "APPROVED"
                          ? t("taskProfilePage.details.documentsTable.approved")
                          : row.status === "DECLINED"
                            ? t("taskProfilePage.details.documentsTable.declined")
                            : row.status;

                        return (
                          <tr key={row.id}>
                            <td className="px-3 py-3 text-slate-100 font-medium max-w-[100px]">{row.type}</td>
                            <td className={`px-3 py-3 font-bold ${getDocumentStatusTone(row.status)}`}>{statusLabel}</td>
                            <td className="px-3 py-3 text-slate-300">{row.expiresOn}</td>
                            <td className="px-3 py-3 text-slate-300">{row.reviewedBy}</td>
                            <td className="px-3 py-3 text-slate-300">{row.submittedBy}</td>
                            <td className="px-3 py-3 text-slate-300">{row.submittedOn}</td>
                            <td className="px-3 py-3 text-slate-300">{row.checkedOn}</td>
                            <td className="px-3 py-3 text-center align-middle">
                              <div className="flex items-center justify-center gap-1.5 min-w-[70px]">
                                <button
                                  type="button"
                                  className="h-8 w-8 rounded border border-sky-500/60 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25 inline-flex items-center justify-center transition-colors"
                                  aria-label={t("common.view")}
                                  title={t("common.view")}
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className="h-8 w-8 rounded border border-emerald-500/60 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 inline-flex items-center justify-center transition-colors"
                                  aria-label="Video"
                                  title="Video"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="23 7 16 12 23 17 23 7" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </V2AccordionSection>
          </div>
        </section>
      ) : null}

      {workspaceModal ? (
        <>
          <button
            type="button"
            aria-label={t("taskProfilePage.closePayload")}
            onClick={() => setWorkspaceModal(null)}
            className="fixed inset-0 z-[65] bg-black/75 backdrop-blur-[1px]"
          />

          <div className={`fixed top-4 z-[75] flex items-center gap-2 ${isRtl ? "left-4" : "right-4"}`}>
            <span className="hidden sm:inline-flex px-3 py-1.5 rounded-md border border-slate-600 bg-[#0f1727] text-slate-100 text-sm font-semibold">
              {workspaceModal === "activity"
                ? t("taskProfilePage.viewTabs.activity")
                : workspaceModal === "details"
                  ? t("taskProfilePage.viewTabs.details")
                  : workspaceModal === "accounts"
                    ? t("taskProfilePage.viewTabs.accountsAndTasks")
                    : t("taskProfilePage.viewTabs.card")}
            </span>

            <button
              type="button"
              onClick={() => setWorkspaceModal(null)}
              className="px-3 py-1.5 rounded-md border border-slate-600 bg-[#111a2c] text-slate-100 text-sm font-semibold hover:bg-slate-700/60"
            >
              {t("taskProfilePage.closePayload")}
            </button>
          </div>
        </>
      ) : null}

      {selectedPayload ? (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t("taskProfilePage.closePayload")}
            onClick={() => setSelectedPayload(null)}
            className="absolute inset-0 bg-black/70"
          />

          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#111a2c] p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">{t("taskProfilePage.payloadTitle")}</h3>
              <button
                type="button"
                onClick={() => setSelectedPayload(null)}
                className="px-3 py-1.5 rounded-md border border-slate-600 text-slate-200 text-sm hover:bg-slate-700/50"
              >
                {t("taskProfilePage.closePayload")}
              </button>
            </div>

            <pre className="mt-4 max-h-[55vh] overflow-auto rounded-lg border border-slate-700 bg-[#0f1727] p-3 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
              {JSON.stringify(selectedPayload.payload, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}

      {openTaskDetailsId ? (
        <TaskDetailsPage
          taskId={openTaskDetailsId}
          isModal
          onClose={() => setOpenTaskDetailsId(null)}
          onOpenClientProfile={(nextClientId) => {
            setOpenTaskDetailsId(null);
            navigate(`/crm/tasks-v1/profile/${nextClientId}`);
          }}
        />
      ) : null}
    </div>
  );
}
