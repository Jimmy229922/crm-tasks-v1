import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getStatusClasses,
  getStatusLabel,
  getTaskById,
  getTaskTypeKeyFromTask,
  getTaskTypeLabel,
  getTypeClasses,
} from "../data/mockTasks";
import { useI18n } from "../../../i18n/I18nProvider";

function toDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(value, locale, fallback) {
  const parsed = toDate(value);
  if (!parsed) {
    return fallback;
  }

  const dateLocale = locale === "ar" ? "ar-EG" : "en-US";

  return parsed.toLocaleString(dateLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatLifetime(createdAt, dueAt, t) {
  const createdDate = toDate(createdAt);
  const dueDate = toDate(dueAt);

  if (!createdDate || !dueDate) {
    return t("common.na");
  }

  const hours = Math.max(1, Math.round((dueDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60)));

  return t("taskDetailsPage.lifetimeHours", { hours }, `${hours} hours`);
}

function resolveActionTaken(status, t) {
  const normalizedStatus = String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  if (normalizedStatus === "DONE") {
    return t("taskDetailsPage.statusActionApprove");
  }

  if (normalizedStatus === "OVERDUE") {
    return t("taskDetailsPage.statusActionEscalate");
  }

  if (normalizedStatus === "IN_PROGRESS") {
    return t("taskDetailsPage.statusActionInProgress");
  }

  return t("taskDetailsPage.statusActionUnderReview");
}

function buildIssueNumber(taskId) {
  const numeric = Number(taskId);

  if (!Number.isFinite(numeric)) {
    return "11170000";
  }

  return String(11170000 + numeric);
}

function buildTransactionId(task) {
  const createdSeed = String(task?.created || task?.createdAt || "")
    .replace(/\D/g, "")
    .slice(-8);

  const taskSeed = String(task?.id || "0").padStart(4, "0");

  return `txn-${createdSeed || "00000000"}-${taskSeed}`;
}

function buildInitialNotes(task, locale, t) {
  if (!task) {
    return [];
  }

  const fallback = t("common.na");
  const assignee = task.assignee?.name || t("common.system");
  const entries = [];

  if (typeof task.notes === "string" && task.notes.trim()) {
    entries.push({
      id: "note-native",
      note: task.notes.trim(),
      postedBy: assignee,
      postedAt: formatDateTime(task.created || task.createdAt, locale, fallback),
      removable: false,
    });
  }

  if (Array.isArray(task.timeline)) {
    task.timeline.forEach((entry, index) => {
      const rawNote = typeof entry?.note === "string" && entry.note.trim()
        ? entry.note.trim()
        : typeof entry?.title === "string" && entry.title.trim()
          ? entry.title.trim()
          : "";

      if (!rawNote) {
        return;
      }

      entries.push({
        id: `timeline-note-${index}`,
        note: rawNote,
        postedBy: assignee,
        postedAt: formatDateTime(entry?.at, locale, fallback),
        removable: false,
      });
    });
  }

  if (entries.length === 0 && typeof task.description === "string" && task.description.trim()) {
    entries.push({
      id: "description-note",
      note: task.description.trim(),
      postedBy: assignee,
      postedAt: formatDateTime(task.created || task.createdAt, locale, fallback),
      removable: false,
    });
  }

  return entries.slice(0, 8);
}

function InfoTable({ rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/70 bg-[#131b2e] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-700/70 last:border-b-0">
              <th className="w-[42%] bg-[#1a243a] px-4 py-3 text-start text-slate-300 font-semibold">{row.label}</th>
              <td className="px-4 py-3 text-slate-100">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TaskDetailsPage({ taskId: taskIdProp = null, isModal = false, onClose, onOpenClientProfile }) {
  const navigate = useNavigate();
  const { taskId: routeTaskId } = useParams();
  const taskId = taskIdProp || routeTaskId;
  const { t, locale } = useI18n();

  const task = useMemo(() => getTaskById(taskId), [taskId]);

  const fallbackValue = t("common.na");

  const initialNotes = useMemo(
    () => buildInitialNotes(task, locale, t),
    [task, locale, t]
  );

  const [notesRows, setNotesRows] = useState(initialNotes);
  const [internalNote, setInternalNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const noteSectionRef = useRef(null);
  const noteInputRef = useRef(null);

  const focusNoteComposer = useCallback(() => {
    if (noteSectionRef.current) {
      noteSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    if (noteInputRef.current) {
      window.requestAnimationFrame(() => {
        noteInputRef.current.focus();
        const cursorIndex = noteInputRef.current.value.length;
        noteInputRef.current.setSelectionRange(cursorIndex, cursorIndex);
      });
    }
  }, []);

  useEffect(() => {
    setNotesRows(initialNotes);
    setInternalNote("");
    setNoteError("");
  }, [initialNotes]);

  useEffect(() => {
    if (!task) {
      return undefined;
    }

    const handleNoteShortcut = (event) => {
      if (event.repeat || event.shiftKey) {
        return;
      }

      const target = event.target;
      if (target instanceof HTMLElement) {
        const targetTag = target.tagName;
        const isTextEntryTarget = target.isContentEditable || targetTag === "INPUT" || targetTag === "TEXTAREA" || targetTag === "SELECT";

        if (isTextEntryTarget) {
          return;
        }
      }

      const normalizedKey = String(event.key || "").toLowerCase();
      const matchesNoteKey = normalizedKey === "n" || normalizedKey === "ى" || event.code === "KeyN";
      const isAltShortcut = event.altKey && !event.ctrlKey && !event.metaKey && matchesNoteKey;
      const isCtrlAltShortcut = event.altKey && event.ctrlKey && !event.metaKey && matchesNoteKey;
      const isF8Shortcut = !event.altKey && !event.ctrlKey && !event.metaKey && (event.key === "F8" || event.code === "F8");
      const isNoteShortcut = isAltShortcut || isCtrlAltShortcut || isF8Shortcut;

      if (!isNoteShortcut) {
        return;
      }

      event.preventDefault();
      setNoteError("");
      focusNoteComposer();
    };

    window.addEventListener("keydown", handleNoteShortcut);

    return () => {
      window.removeEventListener("keydown", handleNoteShortcut);
    };
  }, [focusNoteComposer, task]);

  const handleBack = () => {
    if (isModal && typeof onClose === "function") {
      onClose();
      return;
    }

    navigate("/crm/tasks-v1/risk-management");
  };

  if (!task) {
    return (
      <div className="min-h-screen bg-[#101629] py-10 px-4 sm:px-6 lg:px-8 text-slate-100">
        <div className="max-w-screen-xl mx-auto rounded-2xl border border-slate-700 bg-[#1b2235] p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-white">{t("taskDetailsPage.notFoundTitle")}</h1>
          <p className="text-slate-300 mt-2">{t("taskDetailsPage.notFoundDescription")}</p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
          >
            {t("taskDetailsPage.backToTaskManagement")}
          </button>
        </div>
      </div>
    );
  }

  const taskTypeLabel = getTaskTypeLabel(task.type);
  const taskStatusLabel = getStatusLabel(task.status);
  const statusClasses = getStatusClasses(task.status);
  const typeClasses = getTypeClasses(task.type);

  const createdAt = formatDateTime(task.created || task.createdAt, locale, fallbackValue);
  const dueOn = formatDateTime(task.due || task.dueDate, locale, fallbackValue);
  const lifetime = formatLifetime(task.created || task.createdAt, task.due || task.dueDate, t);

  const actionTaken = resolveActionTaken(task.status, t);
  const issueNumber = buildIssueNumber(task.id);

  const currency = task?.financialData?.currency || "USD";
  const rawAmount = task?.financialData?.amount;
  const numericAmount = typeof rawAmount === "number" ? rawAmount : Number(rawAmount);
  const fallbackAmount = 120 + Number(task.id || 0) * 5;
  const amountNumber = Number.isFinite(numericAmount) ? numericAmount : fallbackAmount;
  const amountLabel = `${amountNumber.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")} ${currency}`;

  const paymentMethod = task?.relatedData?.paymentMethod
    || task?.financialData?.paymentMethod
    || t("taskDetailsPage.defaultPaymentMethod");

  const accountNumber = String(task.client?.accountId || task.id || fallbackValue).toUpperCase();
  const transactionId = task?.financialData?.transactionId || buildTransactionId(task);
  const comment = task?.financialData?.comment
    || task?.description
    || t("taskDetailsPage.emptyDescription");

  const infoColumns = [
    [
      { id: "type", label: t("taskDetailsPage.typeLabel"), value: taskTypeLabel },
      { id: "assigned-to", label: t("taskDetailsPage.assignedTo"), value: task.assignee?.name || fallbackValue },
      { id: "created-by", label: t("taskDetailsPage.createdBy"), value: task.client?.name || fallbackValue },
    ],
    [
      {
        id: "status",
        label: t("common.status"),
        value: (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClasses.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusClasses.dot}`}></span>
            {taskStatusLabel}
          </span>
        ),
      },
      { id: "action", label: t("taskDetailsPage.actionTaken"), value: actionTaken },
      { id: "issue", label: t("taskDetailsPage.issue"), value: issueNumber },
    ],
    [
      { id: "lifetime", label: t("taskDetailsPage.lifetime"), value: lifetime },
      { id: "created", label: t("common.created"), value: createdAt },
      { id: "due", label: t("taskDetailsPage.dueOn"), value: dueOn },
    ],
  ];

  const accountRows = [
    { id: "account-number", label: t("taskDetailsPage.accountNumber"), value: accountNumber },
    { id: "amount", label: t("taskDetailsPage.amount"), value: amountLabel },
    { id: "currency", label: t("taskDetailsPage.currency"), value: currency },
    { id: "payment-method", label: t("taskDetailsPage.paymentMethod"), value: paymentMethod },
    { id: "transaction-id", label: t("taskDetailsPage.transactionId"), value: transactionId },
    { id: "comment", label: t("taskDetailsPage.comment"), value: comment },
  ];

  const taskTypeKey = getTaskTypeKeyFromTask(task);

  const financialTaskTypes = new Set([
    "WithdrawalRequests",
    "ElectronicDeposits",
    "FundsTransfers",
    "InvestmentDeposits",
    "InvestmentWithdrawals",
    "LocalDeposit",
    "LocalWithdrawal",
    "TypeWithdrawalFromRequest",
  ]);

  const supportTaskTypes = new Set([
    "Technical Support",
    "Support",
    "Escalation",
  ]);

  const typeSpecificSectionTitle = financialTaskTypes.has(taskTypeKey)
    ? t("taskDetailsPage.financialData")
    : supportTaskTypes.has(taskTypeKey)
      ? t("taskDetailsPage.relatedData")
      : t("taskDetailsPage.recordSummary");

  const typeSpecificRows = financialTaskTypes.has(taskTypeKey)
    ? [
      { id: "financial-status", label: t("common.status"), value: taskStatusLabel },
      { id: "financial-method", label: t("taskDetailsPage.paymentMethod"), value: paymentMethod },
      { id: "financial-reference", label: t("taskDetailsPage.transactionId"), value: transactionId },
    ]
    : supportTaskTypes.has(taskTypeKey)
      ? [
        { id: "support-assignee", label: t("taskDetailsPage.assignedTo"), value: task.assignee?.name || fallbackValue },
        { id: "support-action", label: t("taskDetailsPage.actionTaken"), value: actionTaken },
        { id: "support-comment", label: t("taskDetailsPage.comment"), value: comment },
      ]
      : [
        { id: "summary-created", label: t("common.created"), value: createdAt },
        { id: "summary-due", label: t("taskDetailsPage.dueOn"), value: dueOn },
        { id: "summary-lifetime", label: t("taskDetailsPage.lifetime"), value: lifetime },
      ];
  const handleAddNote = () => {
    const value = internalNote.trim();

    if (!value) {
      setNoteError(t("taskDetailsPage.internalNoteRequired"));
      return;
    }

    const nextRow = {
      id: `note-custom-${Date.now()}`,
      note: value,
      postedBy: task.assignee?.name || t("common.system"),
      postedAt: formatDateTime(new Date().toISOString(), locale, fallbackValue),
      removable: true,
    };

    setNotesRows((previous) => [nextRow, ...previous]);
    setInternalNote("");
    setNoteError("");
  };

  const removeNote = (noteId) => {
    setNotesRows((previous) => previous.filter((item) => item.id !== noteId));
  };

  const handleOpenClientProfile = () => {
    const nextClientId = task.client?.accountId;

    if (!nextClientId) {
      return;
    }

    if (isModal && typeof onOpenClientProfile === "function") {
      onOpenClientProfile(nextClientId);
      return;
    }

    navigate(`/crm/tasks-v1/profile/${nextClientId}`);
  };

  return (
    <div className={isModal ? "fixed inset-0 z-[80] flex items-center justify-center p-4" : "min-h-screen bg-[#101629] py-8 px-4 sm:px-6 lg:px-8 text-slate-100"}>
      {isModal ? (
        <button
          type="button"
          aria-label={t("common.cancel")}
          onClick={handleBack}
          className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        />
      ) : null}

      <div className={isModal ? "relative w-full max-w-[1320px] max-h-[90vh] overflow-y-auto rounded-2xl bg-[#101629] py-8 px-4 sm:px-6 lg:px-8 text-slate-100 space-y-5" : "max-w-[1320px] mx-auto space-y-5"}>
        <section className="rounded-2xl border border-slate-700/70 bg-[#1b2235] p-4 sm:p-6 shadow-lg shadow-slate-950/25">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{t("taskDetailsPage.headerTitle")}</h1>
              <p className="text-sm text-slate-300 mt-1">#{task.id}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenClientProfile}
                className="px-4 py-2 rounded-lg border border-slate-600 bg-[#121a2e] text-slate-200 hover:bg-slate-700/40 text-sm font-semibold"
              >
                {t("taskDetailsPage.openClientProfile")}
              </button>
              <button
                type="button"
                aria-label={t("taskDetailsPage.backToTaskManagement")}
                onClick={handleBack}
                className="h-10 w-10 rounded-lg border border-slate-600 bg-[#121a2e] text-slate-200 hover:bg-slate-700/40 flex items-center justify-center"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12.5 4.5L7 10l5.5 5.5" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 flex flex-wrap items-center gap-3">
            <span className="text-emerald-200 font-semibold">{taskTypeLabel}</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${typeClasses}`}>
              {taskTypeLabel}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 xl:grid-cols-3 gap-4">
            {infoColumns.map((rows, index) => (
              <InfoTable key={`info-col-${index}`} rows={rows} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700/70 bg-[#1b2235] p-4 sm:p-6 shadow-lg shadow-slate-950/25">
          <h2 className="text-lg font-semibold text-white">{t("taskDetailsPage.accountSectionTitle")}</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-700/70">
            <table className="w-full text-sm">
              <tbody>
                {accountRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-700/70 last:border-b-0">
                    <th className="w-[220px] bg-[#1a243a] px-4 py-3 text-start text-slate-300 font-semibold">{row.label}</th>
                    <td className="bg-[#131b2e] px-4 py-3 text-slate-100 break-words">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700/70 bg-[#1b2235] p-4 sm:p-6 shadow-lg shadow-slate-950/25">
          <h2 className="text-lg font-semibold text-white">{typeSpecificSectionTitle}</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-700/70">
            <table className="w-full text-sm">
              <tbody>
                {typeSpecificRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-700/70 last:border-b-0">
                    <th className="w-[220px] bg-[#1a243a] px-4 py-3 text-start text-slate-300 font-semibold">{row.label}</th>
                    <td className="bg-[#131b2e] px-4 py-3 text-slate-100 break-words">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section ref={noteSectionRef} className="rounded-2xl border border-slate-700/70 bg-[#1b2235] p-4 sm:p-6 shadow-lg shadow-slate-950/25">
          <h2 className="text-lg font-semibold text-white">{t("taskDetailsPage.noteTitle")}</h2>

          <div className="mt-3 overflow-hidden rounded-xl border border-slate-700/70">
            <table className="w-full text-sm">
              <thead className="bg-[#1a243a] border-b border-slate-700/70">
                <tr>
                  <th className="px-4 py-3 text-start text-slate-300 font-semibold uppercase tracking-[0.06em]">{t("taskDetailsPage.noteColumn")}</th>
                  <th className="px-4 py-3 text-start text-slate-300 font-semibold uppercase tracking-[0.06em]">{t("common.posted")}</th>
                  <th className="px-4 py-3 text-start text-slate-300 font-semibold uppercase tracking-[0.06em]">{t("taskDetailsPage.actionsColumn")}</th>
                </tr>
              </thead>
              <tbody>
                {notesRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-5 text-center text-slate-400">{t("taskDetailsPage.emptyNotes")}</td>
                  </tr>
                ) : (
                  notesRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-700/70 last:border-b-0 bg-[#131b2e]">
                      <td className="px-4 py-3 text-slate-100">{row.note}</td>
                      <td className="px-4 py-3 text-slate-300">{row.postedBy} - {row.postedAt}</td>
                      <td className="px-4 py-3">
                        {row.removable ? (
                          <button
                            type="button"
                            onClick={() => removeNote(row.id)}
                            className="px-3 py-1.5 rounded-lg border border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 text-xs font-semibold"
                          >
                            {t("taskDetailsPage.noteActionDelete")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleOpenClientProfile}
                            className="px-3 py-1.5 rounded-lg border border-slate-500 bg-[#1a243a] text-slate-200 hover:bg-slate-700/40 text-xs font-semibold"
                          >
                            {t("taskDetailsPage.noteActionOpenProfile")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-semibold text-slate-200 mb-2" htmlFor="internal-note-input">
              {t("taskDetailsPage.internalNoteLabel")}
            </label>
            <textarea
              ref={noteInputRef}
              id="internal-note-input"
              value={internalNote}
              onChange={(event) => {
                setInternalNote(event.target.value);
                if (noteError) {
                  setNoteError("");
                }
              }}
              rows={4}
              className="w-full rounded-xl border border-slate-700 bg-[#131b2e] px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={t("taskDetailsPage.internalNotePlaceholder")}
            />
            {noteError ? <p className="mt-2 text-sm text-red-300">{noteError}</p> : null}

            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleAddNote}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 4v12M4 10h12" />
                </svg>
                {t("taskDetailsPage.addNote")}
              </button>
              <p className="text-xs text-slate-400">{t("taskDetailsPage.internalNoteHint")}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
