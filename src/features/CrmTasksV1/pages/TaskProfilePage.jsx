import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getStatusClasses,
  getStatusLabel,
  getTaskById,
  getTaskTypeLabel,
  getTasksByClientEmail,
  getTypeClasses,
} from "../data/mockTasks";
import { useI18n } from "../../../i18n/I18nProvider";

export default function TaskProfilePage() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState("overview");
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef(null);

  const formatDate = (value, options) => {
    if (!value) {
      return t("common.na");
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return String(value);
    }

    return parsed.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", options || {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatMonthYearDate = (value) => formatDate(value, {
    month: "short",
    year: "numeric",
  });

  const getPriorityLabel = (priorityValue) => {
    const normalized = String(priorityValue || "").trim().toLowerCase();

    if (normalized === "high") {
      return t("priorities.high");
    }

    if (normalized === "medium") {
      return t("priorities.medium");
    }

    if (normalized === "low") {
      return t("priorities.low");
    }

    return priorityValue || t("common.na");
  };

  useEffect(() => {
    setActiveTab("overview");
    setIsActionMenuOpen(false);
  }, [taskId]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!actionMenuRef.current || actionMenuRef.current.contains(event.target)) {
        return;
      }
      setIsActionMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsActionMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const task = useMemo(() => getTaskById(taskId), [taskId]);
  const clientTasks = useMemo(() => {
    if (!task) {
      return [];
    }
    return getTasksByClientEmail(task.client.email);
  }, [task]);

  const completedTasks = clientTasks.filter((item) => item.status === "Done").length;
  const inProgressTasks = clientTasks.filter((item) => item.status === "In Progress").length;
  const pendingTasks = clientTasks.filter((item) => item.status === "Pending" || item.status === "Overdue").length;
  const completionRate = clientTasks.length > 0 ? Math.round((completedTasks / clientTasks.length) * 100) : 0;

  const activityEvents = useMemo(() => {
    if (!task) {
      return [];
    }

    const localizedDueDate = formatDate(task.due);

    const primary = (task.timeline || []).map((event, index) => ({
      id: `timeline-${index}`,
      title: event.title,
      actor: task.assignee.name,
      timestamp: formatDate(event.at),
      note: event.note,
    }));

    const supplemental = [
      {
        id: "system-update",
        title: t("taskProfilePage.activity.dueDateUpdated", { dueDate: localizedDueDate }, `Due date updated to ${localizedDueDate}`),
        actor: t("common.system"),
        timestamp: formatDate(task.created),
        note: t("taskProfilePage.activity.timelineSynced"),
      },
      {
        id: "task-created",
        title: t("common.taskCreated"),
        actor: task.assignee.name,
        timestamp: formatDate(task.created),
        note: t("taskProfilePage.activity.initialTaskSetup"),
      },
    ];

    return [...primary, ...supplemental].slice(0, 5);
  }, [task, t, locale]);

  const documents = useMemo(() => {
    if (!task) {
      return [];
    }

    return [
      {
        id: "doc-1",
        name: `${task.client.accountId}-KYC-Form.pdf`,
        updatedAt: "Apr 02, 2026",
        type: "PDF",
      },
      {
        id: "doc-2",
        name: `${task.client.accountId}-Contract-v2.docx`,
        updatedAt: "Apr 04, 2026",
        type: "DOCX",
      },
      {
        id: "doc-3",
        name: `${task.client.accountId}-Implementation-Plan.xlsx`,
        updatedAt: "Apr 05, 2026",
        type: "XLSX",
      },
    ];
  }, [task]);

  if (!task) {
    return (
      <div className="min-h-screen bg-[#151521] py-10 px-4 sm:px-6 lg:px-8 text-slate-100">
        <div className="max-w-screen-xl mx-auto rounded-2xl border border-slate-700 bg-[#1e1e2d] p-8 text-center shadow-sm">
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
    <div className="min-h-screen bg-[#151521] text-slate-100">
      <header className="relative z-40 border-b border-slate-700 bg-[#1e1e2d]/95 backdrop-blur overflow-visible">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/crm/tasks-v1/risk-management")}
              className="w-9 h-9 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-700/40"
            >
              <span aria-hidden="true">←</span>
            </button>
            <h1 className="text-3xl font-semibold text-white">{t("taskProfilePage.title")}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/crm/tasks-v1/task/${task.id}`)}
              className="px-4 py-2 rounded-lg border border-slate-600 bg-[#151521] text-slate-200 hover:bg-slate-700/40 text-sm font-semibold"
            >
              {t("taskProfilePage.openTaskDetails")}
            </button>
            <button className="px-4 py-2 rounded-lg border border-slate-600 bg-[#151521] text-slate-200 hover:bg-slate-700/40 text-sm font-semibold">
              {t("taskProfilePage.edit")}
            </button>
            <div className="relative z-50" ref={actionMenuRef}>
              <button
                type="button"
                onClick={() => setIsActionMenuOpen((prev) => !prev)}
                className="w-10 h-10 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-700/40 flex items-center justify-center"
                aria-label={t("taskProfilePage.openProfileActionsAria")}
                aria-haspopup="menu"
                aria-expanded={isActionMenuOpen}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {isActionMenuOpen ? (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-[#cfcfcf] bg-[#ececec] shadow-[0_16px_30px_rgba(0,0,0,0.35)] py-1.5 z-[90]">
                  <button
                    type="button"
                    onClick={() => setIsActionMenuOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-[15px] font-medium text-[#1f1f1f] hover:bg-[#dddddd]"
                  >
                    {t("taskProfilePage.menu.editTask")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsActionMenuOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-[15px] font-medium text-[#1f1f1f] hover:bg-[#dddddd]"
                  >
                    {t("taskProfilePage.menu.changeStatus")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsActionMenuOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-[15px] font-medium text-[#1f1f1f] hover:bg-[#dddddd]"
                  >
                    {t("taskProfilePage.menu.reassign")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsActionMenuOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-[15px] font-medium text-[#ff2424] hover:bg-[#dddddd]"
                  >
                    {t("taskProfilePage.menu.delete")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <section className="rounded-2xl border border-slate-700 bg-[#1e1e2d] shadow-sm overflow-hidden">
          <div className="h-44 bg-gradient-to-r from-[#0b102d] via-[#5b5fff] to-[#e14cff] relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_40%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.20),transparent_45%)]"></div>
          </div>

          <div className="px-6 pb-6">
            <div className="relative z-10 -mt-10 md:-mt-11 flex flex-col md:flex-row md:items-center gap-4">
              <div className={`w-24 h-24 rounded-full border-4 border-[#1e1e2d] shadow-lg flex items-center justify-center text-4xl font-semibold text-white ${task.client.color}`}>
                {task.client.initials}
              </div>

              <div className="pt-1 md:pt-2">
                <h2 className="text-4xl md:text-5xl leading-tight font-bold text-white">{task.client.name}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                  <span>{t("taskProfilePage.headerBadges.corporateClient")}</span>
                  <span>•</span>
                  <span>{task.client.country}</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-500/30">
                    {t("taskProfilePage.headerBadges.keyAccount")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-700 bg-[#1e1e2d] p-6 shadow-sm">
              <h3 className="text-3xl font-semibold text-white mb-5">{t("taskProfilePage.contactInformation")}</h3>

              <div className="space-y-5">
                <div className="rounded-xl bg-[#151521] border border-slate-700 p-4">
                  <p className="text-xs text-slate-400 font-semibold">{t("taskProfilePage.emailAddress")}</p>
                  <p className="text-base text-blue-300 font-medium mt-1 break-all">{task.client.email}</p>
                </div>

                <div className="rounded-xl bg-[#151521] border border-slate-700 p-4">
                  <p className="text-xs text-slate-400 font-semibold">{t("taskProfilePage.phoneNumber")}</p>
                  <p className="text-base text-slate-100 font-medium mt-1">{task.client.phone}</p>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-slate-700 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 font-semibold">{t("common.clientId")}</p>
                  <p className="text-base text-slate-100 mt-1">{task.client.accountId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold">{t("common.joined")}</p>
                  <p className="text-base text-slate-100 mt-1">{formatMonthYearDate(task.client.joinedAt)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-700 bg-[#1e1e2d] p-6 shadow-sm">
              <h3 className="text-3xl font-semibold text-white mb-5">{t("taskProfilePage.projectProgress")}</h3>

              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-300 font-medium">{t("taskProfilePage.completionRate")}</span>
                <span className="text-white font-semibold">{completionRate}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${completionRate}%` }}></div>
              </div>

              <div className="mt-5 space-y-2 text-sm">
                <div className="flex items-center justify-between text-slate-200">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span>{t("taskProfilePage.completed")}</span>
                  <span>{completedTasks}</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>{t("taskProfilePage.inProgress")}</span>
                  <span>{inProgressTasks}</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-400"></span>{t("taskProfilePage.pending")}</span>
                  <span>{pendingTasks}</span>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl border border-slate-700 bg-[#1e1e2d] p-1 shadow-sm flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === "overview" ? "bg-[#2a2a3c] text-white" : "text-slate-300 hover:bg-slate-700/40"
                }`}
              >
                {t("taskProfilePage.tabs.overview")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tasks")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === "tasks" ? "bg-[#2a2a3c] text-white" : "text-slate-300 hover:bg-slate-700/40"
                }`}
              >
                {t("taskProfilePage.tabs.tasks", { count: clientTasks.length }, `Tasks (${clientTasks.length})`)}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("documents")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === "documents" ? "bg-[#2a2a3c] text-white" : "text-slate-300 hover:bg-slate-700/40"
                }`}
              >
                {t("taskProfilePage.tabs.documents")}
              </button>
            </section>

            {activeTab === "overview" ? (
              <section className="rounded-2xl border border-slate-700 bg-[#1e1e2d] p-6 shadow-sm">
                <h3 className="text-4xl font-semibold text-white mb-1">{t("taskProfilePage.recentActivity")}</h3>
                <p className="text-slate-300 text-sm mb-5">{t("taskProfilePage.recentActivityDescription")}</p>

                <div className="space-y-5">
                  {activityEvents.map((event, index) => (
                    <div key={event.id} className="grid grid-cols-[auto,1fr,auto] gap-3">
                      <div className="relative flex flex-col items-center">
                        <span className="w-3 h-3 rounded-full bg-blue-500 mt-1"></span>
                        {index !== activityEvents.length - 1 ? (
                          <span className="w-px flex-1 bg-slate-700 mt-1"></span>
                        ) : null}
                      </div>

                      <div>
                        <p className="text-base font-semibold text-white">{event.title}</p>
                        <p className="text-sm text-slate-300 mt-0.5">{event.actor}</p>
                      </div>

                      <p className="text-xs text-slate-400 whitespace-nowrap mt-1">{event.timestamp}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {activeTab === "tasks" ? (
              <section className="rounded-2xl border border-slate-700 bg-[#1e1e2d] p-0 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-[#2a2a3c]">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-100 uppercase tracking-wider">{t("common.task")}</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-100 uppercase tracking-wider">{t("common.type")}</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-100 uppercase tracking-wider">{t("common.status")}</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-100 uppercase tracking-wider">{t("common.priority")}</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-100 uppercase tracking-wider">{t("common.dueDate")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {clientTasks.map((item) => {
                      const statusClass = getStatusClasses(item.status);
                      const typeClass = getTypeClasses(item.type);
                      const statusLabel = getStatusLabel(item.status);
                      const typeLabel = getTaskTypeLabel(item.type);

                      return (
                        <tr key={item.id} className="hover:bg-[#252538] transition-colors">
                          <td className="px-5 py-3 text-sm text-white font-semibold">
                            <button
                              type="button"
                              onClick={() => navigate(`/crm/tasks-v1/task/${item.id}`)}
                              className="text-left hover:text-cyan-300 transition-colors"
                            >
                              {t("taskProfilePage.taskRowTitle", { id: item.id }, `Task #${item.id}`)}
                            </button>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${typeClass}`}>
                              {typeLabel}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusClass.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusClass.dot}`}></span>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-200">{getPriorityLabel(item.priority)}</td>
                          <td className="px-5 py-3 text-sm text-slate-200">{formatDate(item.due)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            ) : null}

            {activeTab === "documents" ? (
              <section className="rounded-2xl border border-slate-700 bg-[#1e1e2d] p-6 shadow-sm space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="rounded-xl border border-slate-700 bg-[#151521] px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{doc.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t("taskProfilePage.documentUpdatedAt", { date: formatDate(doc.updatedAt) }, `Updated: ${formatDate(doc.updatedAt)}`)}</p>
                    </div>
                    <span className="px-2 py-1 rounded-md bg-[#1e1e2d] border border-slate-600 text-xs font-semibold text-slate-200">
                      {doc.type}
                    </span>
                  </div>
                ))}
              </section>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
