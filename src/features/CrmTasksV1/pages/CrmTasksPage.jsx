import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CRM_TASK_STATUS_ENUM_OPTIONS,
  MOCK_TASKS,
  PAGE_SIZE_OPTIONS,
  fetchCrmTasksLocal,
  formatIsoDateForDisplay,
  getMetrics,
  getStatusClasses,
  getStatusLabel,
  getTaskTypeKeyFromTask,
  getTaskTypeLabel,
  getTypeClasses,
} from "../data/mockTasks";
import { useI18n } from "../../../i18n/I18nProvider";

const METRIC_THEMES = {
  "Total Tasks": {
    card: "border-slate-600/70 bg-gradient-to-br from-slate-800/70 via-slate-900/55 to-slate-950/60",
    label: "text-slate-200",
    iconWrap: "border-slate-500/40 bg-slate-700/35 text-slate-200",
    progress: "bg-slate-300",
    glow: "bg-slate-400/25",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
  "In Progress": {
    card: "border-blue-500/35 bg-gradient-to-br from-blue-600/15 via-[#1a2238] to-[#131a2b]",
    label: "text-blue-200",
    iconWrap: "border-blue-400/40 bg-blue-500/15 text-blue-200",
    progress: "bg-blue-400",
    glow: "bg-blue-500/30",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
  Overdue: {
    card: "border-rose-500/35 bg-gradient-to-br from-rose-600/15 via-[#291820] to-[#19131d]",
    label: "text-rose-200",
    iconWrap: "border-rose-400/40 bg-rose-500/15 text-rose-200",
    progress: "bg-rose-400",
    glow: "bg-rose-500/30",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
  Completed: {
    card: "border-emerald-500/35 bg-gradient-to-br from-emerald-600/15 via-[#142420] to-[#131d1a]",
    label: "text-emerald-200",
    iconWrap: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
    progress: "bg-emerald-400",
    glow: "bg-emerald-500/30",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12.5l2.6 2.6L16 9.7" />
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
};

const DEFAULT_METRIC_THEME = METRIC_THEMES["Total Tasks"];
const CLIENT_AVATAR_THEMES = ["bg-indigo-500", "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-cyan-500"];
const CUSTOM_TASKS_STORAGE_KEY = "crmTasksV1CustomTasks";
const ACTIONS_MENU_ESTIMATED_HEIGHT = 176;
const ACTIONS_MENU_VIEWPORT_PADDING = 16;
const METRIC_LABEL_KEYS = {
  "Total Tasks": "crmTasksPage.metrics.totalTasks",
  "In Progress": "crmTasksPage.metrics.inProgress",
  Overdue: "crmTasksPage.metrics.overdue",
  Completed: "crmTasksPage.metrics.completed",
};

const getInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "NA";
};

const formatTaskDateLabel = (date) => {
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
};

const readCustomTasksFromStorage = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(CUSTOM_TASKS_STORAGE_KEY);
    const parsed = rawValue ? JSON.parse(rawValue) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (task) =>
        task
        && (typeof task.id === "number" || typeof task.id === "string")
        && task.client
        && typeof task.client.email === "string"
        && task.assignee
        && typeof task.assignee.email === "string"
    );
  } catch {
    return [];
  }
};

const writeCustomTasksToStorage = (tasks) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CUSTOM_TASKS_STORAGE_KEY, JSON.stringify(tasks));
};

export default function CrmTasksPage() {
  const { t, isRtl } = useI18n();
  const navigate = useNavigate();
  const [uiState, setUiState] = useState("loading");
  const [listResponse, setListResponse] = useState({
    items: [],
    page: 1,
    perPage: 20,
    totalItems: 0,
    totalPages: 1,
  });
  const [reloadTick, setReloadTick] = useState(0);
  const [customTasks, setCustomTasks] = useState(() => readCustomTasksFromStorage());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [openActionsTaskId, setOpenActionsTaskId] = useState(null);
  const [isActionsMenuOpenUpward, setIsActionsMenuOpenUpward] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [assignedToEmail, setAssignedToEmail] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [addTaskError, setAddTaskError] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedStatus, rowsPerPage]);

  useEffect(() => {
    let isActive = true;

    setUiState("loading");
    setShowErrorToast(false);

    fetchCrmTasksLocal({
      page: currentPage,
      perPage: rowsPerPage,
      search: searchTerm,
      status: selectedStatus,
      taskType: selectedType,
    })
      .then((response) => {
        if (!isActive) {
          return;
        }

        setListResponse(response);
        setUiState("success");

        if (response.page !== currentPage) {
          setCurrentPage(response.page);
        }
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setUiState("error");
        setShowErrorToast(true);
      });

    return () => {
      isActive = false;
    };
  }, [currentPage, rowsPerPage, searchTerm, selectedStatus, selectedType, reloadTick, customTasks]);

  useEffect(() => {
    setShowErrorToast(uiState === "error");
  }, [uiState]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const clickedMenu = event.target.closest("[data-task-actions-menu]");
      const clickedMenuButton = event.target.closest("[data-task-actions-button]");

      if (!clickedMenu && !clickedMenuButton) {
        setOpenActionsTaskId(null);
        setIsActionsMenuOpenUpward(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenActionsTaskId(null);
        setIsActionsMenuOpenUpward(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!isAddTaskModalOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsAddTaskModalOpen(false);
        setAssignedToEmail("");
        setTaskDescription("");
        setAddTaskError("");
        setIsAddingTask(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isAddTaskModalOpen]);

  const allTasks = useMemo(() => [...customTasks, ...MOCK_TASKS], [customTasks]);

  const metrics = useMemo(() => getMetrics(allTasks), [allTasks]);
  const maxMetricCount = useMemo(() => Math.max(...metrics.map((metric) => metric.count), 1), [metrics]);
  const taskTypes = useMemo(() => Array.from(new Set(allTasks.map((task) => getTaskTypeKeyFromTask(task)).filter(Boolean))), [allTasks]);
  const statuses = useMemo(() => CRM_TASK_STATUS_ENUM_OPTIONS, []);
  const assigneeOptions = useMemo(
    () => Array.from(new Map(allTasks.map((task) => [task.assignee.email, task.assignee])).values()),
    [allTasks]
  );

  const totalItems = listResponse.totalItems;
  const totalPages = listResponse.totalPages;
  const paginatedTasks = listResponse.items;
  const showEmptyState = uiState === "success" && totalItems === 0;

  const handleRetry = () => {
    setShowErrorToast(false);
    setReloadTick((prev) => prev + 1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedStatus("");
    setCurrentPage(1);
  };

  const closeAddTaskModal = () => {
    setIsAddTaskModalOpen(false);
    setAssignedToEmail("");
    setTaskDescription("");
    setAddTaskError("");
    setIsAddingTask(false);
  };

  const openAddTaskModal = () => {
    setOpenActionsTaskId(null);
    setIsActionsMenuOpenUpward(false);
    setAddTaskError("");
    setIsAddTaskModalOpen(true);
  };

  const handleToggleTaskActionsMenu = (event, taskId) => {
    event.stopPropagation();

    if (openActionsTaskId === taskId) {
      setOpenActionsTaskId(null);
      setIsActionsMenuOpenUpward(false);
      return;
    }

    const buttonRect = event.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const shouldOpenUpward = spaceBelow < ACTIONS_MENU_ESTIMATED_HEIGHT + ACTIONS_MENU_VIEWPORT_PADDING;

    setIsActionsMenuOpenUpward(shouldOpenUpward);
    setOpenActionsTaskId(taskId);
  };

  const handleAddTask = (event) => {
    event.preventDefault();

    const normalizedDescription = taskDescription.trim();

    if (!assignedToEmail || !normalizedDescription) {
      setAddTaskError(t("crmTasksPage.errors.requiredFields"));
      return;
    }

    const selectedAssignee = assigneeOptions.find((assignee) => assignee.email === assignedToEmail);
    if (!selectedAssignee) {
      setAddTaskError(t("crmTasksPage.errors.invalidAssignee"));
      return;
    }

    setIsAddingTask(true);
    setAddTaskError("");

    try {
      const maxId = allTasks.reduce((result, task) => {
        const numericId = Number(task.id);
        return Number.isFinite(numericId) ? Math.max(result, numericId) : result;
      }, 0);
      const nextTaskId = maxId + 1;

      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 7);

      const createdLabel = formatTaskDateLabel(now);
      const dueLabel = formatTaskDateLabel(dueDate);
      const clientName = t("crmTasksPage.defaults.newClient", { id: nextTaskId }, `New Client ${nextTaskId}`);

      const newTask = {
        id: nextTaskId,
        client: {
          name: clientName,
          email: `client.${nextTaskId}@crm.local`,
          phone: "N/A",
          initials: getInitials(clientName),
          color: CLIENT_AVATAR_THEMES[nextTaskId % CLIENT_AVATAR_THEMES.length],
          company: "N/A",
          accountId: `c${nextTaskId}`,
          country: "N/A",
          address: "N/A",
          industry: "N/A",
          joinedAt: createdLabel,
        },
        type: "CustomTask",
        status: "Pending",
        priority: "Medium",
        assignee: {
          name: selectedAssignee.name,
          role: selectedAssignee.role || t("crmTasksPage.defaults.teamMember"),
          initials: selectedAssignee.initials || getInitials(selectedAssignee.name),
          color: selectedAssignee.color || "bg-indigo-500",
          email: selectedAssignee.email,
        },
        created: createdLabel,
        due: dueLabel,
        isOverdue: false,
        description: normalizedDescription,
        timeline: [
          {
            title: "Task created",
            at: createdLabel,
            note: normalizedDescription,
          },
        ],
        actions: ["Open Task Details"],
      };

      setCustomTasks((previousTasks) => {
        const updatedTasks = [newTask, ...previousTasks];
        writeCustomTasksToStorage(updatedTasks);
        return updatedTasks;
      });

      setUiState("success");
      setCurrentPage(1);
      closeAddTaskModal();
    } catch {
      setAddTaskError(t("crmTasksPage.errors.saveFailed"));
      setIsAddingTask(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#151521] py-8 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-[1460px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-indigo-300 font-bold bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/30">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              {t("crmTasksPage.suiteTitle")}
            </div>
            <h1 className="text-4xl font-bold text-white">{t("crmTasksPage.pageTitle")}</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openAddTaskModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {t("crmTasksPage.createNewTask")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((metric) => {
            const theme = METRIC_THEMES[metric.label] || DEFAULT_METRIC_THEME;
            const fillWidth = Math.max(14, Math.round((metric.count / maxMetricCount) * 100));
            const metricLabel = t(METRIC_LABEL_KEYS[metric.label] || "", null, metric.label);

            return (
              <div
                key={metric.label}
                className={`relative overflow-hidden rounded-xl p-3.5 border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${theme.card}`}
              >
                <span className={`pointer-events-none absolute -top-7 -right-7 w-20 h-20 rounded-full blur-2xl ${theme.glow}`}></span>
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${metric.color}`}></span>
                      <span className={`text-[11px] font-semibold tracking-[0.08em] uppercase ${theme.label}`}>{metricLabel}</span>
                    </div>
                    <div className="mt-2 inline-flex items-end gap-1.5">
                      <span className="text-2xl font-semibold text-white leading-none">{metric.count}</span>
                      <span className="text-[11px] text-slate-400 pb-0.5">{t("crmTasksPage.tasksSuffix")}</span>
                    </div>
                  </div>
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.25)] ${theme.iconWrap}`}
                  >
                    {theme.icon}
                  </div>
                </div>
                <div className="relative mt-3 h-1.5 rounded-full bg-slate-900/70 overflow-hidden">
                  <div className={`h-full rounded-full ${theme.progress}`} style={{ width: `${fillWidth}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-[#1e1e2d] rounded-2xl shadow-lg border border-slate-700 overflow-hidden">
          <div className="p-6 pb-4 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white leading-tight">{t("crmTasksPage.allTasks")}</h2>
            <p className="text-sm text-slate-300 mb-5">{t("crmTasksPage.tasksFound", { count: totalItems }, `${totalItems} tasks found`)}</p>

            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                  }}
                  type="text"
                  className="block w-full pl-11 pr-4 py-3 border border-slate-700 rounded-xl bg-[#151521] hover:bg-[#1a1a27] focus:bg-[#1a1a27] placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-slate-100 transition-colors"
                  placeholder={t("crmTasksPage.searchPlaceholder")}
                />
              </div>

              <div className="flex gap-3 w-full lg:w-auto">
                <select
                  value={selectedType}
                  onChange={(event) => setSelectedType(event.target.value)}
                  className="block w-full lg:w-48 pl-4 pr-10 py-3 text-base border border-slate-700 rounded-xl bg-[#151521] text-slate-200 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t("crmTasksPage.taskTypeFilter")}</option>
                  {taskTypes.map((typeKey) => (
                    <option key={typeKey} value={typeKey}>
                      {getTaskTypeLabel(typeKey)}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="block w-full lg:w-44 pl-4 pr-10 py-3 text-base border border-slate-700 rounded-xl bg-[#151521] text-slate-200 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t("crmTasksPage.statusFilter")}</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {showEmptyState ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-slate-700/60 border border-slate-600 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M6.343 6.343a8 8 0 0111.314 0M4 12h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">{t("crmTasksPage.noResultsTitle")}</h3>
              <p className="text-sm text-slate-300 mt-2">{t("crmTasksPage.noResultsDescription")}</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
              >
                {t("crmTasksPage.clearFilters")}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-slate-700/70 bg-[#101827]">
              <table className="w-full table-fixed text-sm md:text-base">
                <colgroup>
                  <col className="w-[27%]" />
                  <col className="w-[13%]" />
                  <col className="w-[12%]" />
                  <col className="w-[19%]" />
                  <col className="w-[9%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                </colgroup>

                <thead className="bg-[#696e77] border-b border-slate-500/70">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-bold text-slate-50 uppercase tracking-[0.08em]">
                      {t("crmTasksPage.table.clientInfo")}
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-bold text-slate-50 uppercase tracking-[0.08em]">
                      {t("crmTasksPage.table.taskType")}
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-bold text-slate-50 uppercase tracking-[0.08em]">
                      {t("crmTasksPage.table.status")}
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-bold text-slate-50 uppercase tracking-[0.08em]">
                      {t("crmTasksPage.table.assignee")}
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-bold text-slate-50 uppercase tracking-[0.08em]">
                      {t("crmTasksPage.table.created")}
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-bold text-slate-50 uppercase tracking-[0.08em]">
                      {t("crmTasksPage.table.dueDate")}
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-center text-xs font-bold text-slate-50 uppercase tracking-[0.08em]">
                      {t("crmTasksPage.table.actions")}
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-[#0f1724] divide-y divide-[#233149]">
                  {uiState === "loading" ? (
                    Array.from({ length: rowsPerPage }).map((_, index) => (
                      <tr key={`skeleton-${index}`} className="animate-pulse">
                        <td className="px-5 py-3.5 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                            <div className="space-y-2">
                              <div className="h-4 w-36 bg-slate-700 rounded"></div>
                              <div className="h-3.5 w-52 bg-slate-800 rounded"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 align-middle"><div className="h-6 w-28 bg-slate-700 rounded-full"></div></td>
                        <td className="px-5 py-3.5 align-middle"><div className="h-6 w-24 bg-slate-800 rounded-full"></div></td>
                        <td className="px-5 py-3.5 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-700 rounded-full"></div>
                            <div>
                              <div className="h-4 bg-slate-700 rounded w-24 mb-2"></div>
                              <div className="h-3 bg-slate-800 rounded w-20"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 align-middle"><div className="h-4 w-20 bg-slate-700 rounded"></div></td>
                        <td className="px-5 py-3.5 align-middle"><div className="h-4 w-20 bg-slate-700 rounded"></div></td>
                        <td className="px-5 py-3.5 align-middle text-center"><div className="h-4 w-4 bg-slate-700 rounded mx-auto"></div></td>
                      </tr>
                    ))
                  ) : uiState === "error" ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <p className="text-slate-200 font-semibold">{t("crmTasksPage.errors.loadFailedInline")}</p>
                        <button
                          type="button"
                          onClick={handleRetry}
                          className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold"
                        >
                          {t("common.retry")}
                        </button>
                      </td>
                    </tr>
                  ) : (
                    paginatedTasks.map((task, index) => {
                      const statusClasses = getStatusClasses(task.status);
                      const statusLabel = getStatusLabel(task.status);
                      const taskTypeKey = task.taskType;
                      const taskTypeLabel = getTaskTypeLabel(taskTypeKey);
                      const typeClasses = getTypeClasses(taskTypeKey);
                      const isOverdue = task.status === "OVERDUE";
                      const clientInitials = getInitials(task.client.name);
                      const clientAvatarClass = CLIENT_AVATAR_THEMES[index % CLIENT_AVATAR_THEMES.length];

                      return (
                        <tr key={task.id} className="hover:bg-[#17253c] transition-colors duration-150">
                          <td className="px-5 py-3.5 align-middle">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${clientAvatarClass}`}>
                                {clientInitials}
                              </div>
                              <div className="min-w-0">
                                <div className="text-base font-semibold text-white leading-tight truncate">{task.client.name}</div>
                                <div className="text-sm text-slate-300 mt-0.5 truncate">{task.client.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 align-middle">
                            <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold border ${typeClasses}`}>
                              {taskTypeLabel}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 align-middle">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${statusClasses.badge}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusClasses.dot}`}></span>
                              {statusLabel}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 align-middle">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${task.assignee.color}`}
                              >
                                {task.assignee.initials}
                              </div>
                              <div>
                                <div className="text-base font-semibold text-white truncate">{task.assignee.name}</div>
                                <div className="text-sm text-slate-300 truncate">{task.assignee.role}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 align-middle whitespace-nowrap">
                            <span className="text-base font-medium text-slate-200">{formatIsoDateForDisplay(task.createdAt)}</span>
                          </td>

                          <td className="px-5 py-3.5 align-middle whitespace-nowrap text-base font-medium">
                            <span className={isOverdue ? "text-red-400 font-semibold" : "text-slate-200"}>{formatIsoDateForDisplay(task.dueDate)}</span>
                          </td>

                          <td className="px-5 py-3.5 align-middle whitespace-nowrap text-center">
                            <div className="relative flex items-center justify-center gap-1">
                              <button
                                type="button"
                                title={t("crmTasksPage.buttons.openUserProfile")}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenActionsTaskId(null);
                                  setIsActionsMenuOpenUpward(false);
                                  navigate(`/crm/tasks-v1/profile/${task.id}`);
                                }}
                                className="text-slate-300 hover:text-cyan-300 transition-colors p-2 rounded-lg hover:bg-slate-700/60"
                              >
                                <svg className="w-[18px] h-[18px] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5.121 17.804A12.072 12.072 0 0112 15.75c2.522 0 4.863.773 6.879 2.095M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                                  />
                                </svg>
                              </button>

                              <button
                                type="button"
                                title={t("crmTasksPage.buttons.openTaskDetails")}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenActionsTaskId(null);
                                  setIsActionsMenuOpenUpward(false);
                                  navigate(`/crm/tasks-v1/task/${task.id}`);
                                }}
                                className="text-slate-300 hover:text-emerald-300 transition-colors p-2 rounded-lg hover:bg-slate-700/60"
                              >
                                <svg className="w-[18px] h-[18px] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </button>

                              <button
                                type="button"
                                title={t("crmTasksPage.buttons.moreActions")}
                                data-task-actions-button
                                onClick={(event) => handleToggleTaskActionsMenu(event, task.id)}
                                className="text-slate-300 hover:text-indigo-300 transition-colors p-2 rounded-lg hover:bg-slate-700/60"
                              >
                                <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>

                              {openActionsTaskId === task.id ? (
                                <div
                                  data-task-actions-menu
                                  className={`absolute ${isRtl ? "left-0" : "right-0"} z-20 w-44 rounded-xl border border-slate-600 bg-[#0f172a] shadow-[0_20px_40px_rgba(0,0,0,0.55)] py-1 whitespace-normal ${
                                    isActionsMenuOpenUpward ? "bottom-10 mb-1" : "top-10 mt-1"
                                  }`}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionsTaskId(null);
                                      setIsActionsMenuOpenUpward(false);
                                      navigate(`/crm/tasks-v1/task/${task.id}`);
                                    }}
                                    className="block w-full text-start px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/45"
                                  >
                                    {t("crmTasksPage.buttons.openTaskDetails")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionsTaskId(null);
                                      setIsActionsMenuOpenUpward(false);
                                      navigate(`/crm/tasks-v1/profile/${task.id}`);
                                    }}
                                    className="block w-full text-start px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/45"
                                  >
                                    {t("crmTasksPage.buttons.openClientProfile")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionsTaskId(null);
                                      setIsActionsMenuOpenUpward(false);
                                    }}
                                    className="block w-full text-start px-4 py-2.5 text-sm text-emerald-300 hover:bg-emerald-500/15"
                                  >
                                    {t("crmTasksPage.buttons.markAsDone")}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {uiState === "success" && totalItems > 0 ? (
            <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-end gap-4 text-sm text-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-slate-300">{t("crmTasksPage.buttons.rowsPerPage")}</span>
                <select
                  value={rowsPerPage}
                  onChange={(event) => setRowsPerPage(Number(event.target.value))}
                  className="px-2 py-1 rounded-md bg-[#151521] border border-slate-700 text-slate-100"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <span>
                {t("crmTasksPage.buttons.pageOf", { currentPage, totalPages }, `Page ${currentPage} of ${totalPages}`)}
              </span>

              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="w-8 h-8 rounded-md border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700/40"
              >
                <span aria-hidden="true">&lt;</span>
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="w-8 h-8 rounded-md border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700/40"
              >
                <span aria-hidden="true">&gt;</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {isAddTaskModalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
              aria-label={t("crmTasksPage.addTaskModal.closeAria")}
            onClick={closeAddTaskModal}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-600 bg-[#1e1e2d] shadow-[0_30px_80px_rgba(0,0,0,0.55)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-[#1b2235]">
              <h3 className="text-2xl font-bold text-white">{t("crmTasksPage.addTaskModal.title")}</h3>
              <button
                type="button"
                onClick={closeAddTaskModal}
                className="w-9 h-9 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700/40"
              >
                <span aria-hidden="true">X</span>
              </button>
            </div>

            <form onSubmit={handleAddTask} className="px-6 py-5 space-y-5">
              {addTaskError ? (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/15 px-4 py-2.5 text-sm text-rose-200">
                  {addTaskError}
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">{t("crmTasksPage.addTaskModal.assignedTo")}</label>
                <select
                  value={assignedToEmail}
                  onChange={(event) => setAssignedToEmail(event.target.value)}
                  className="block w-full px-4 py-3 text-base border border-slate-700 rounded-xl bg-[#151521] text-slate-200 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t("crmTasksPage.addTaskModal.selectAssignee")}</option>
                  {assigneeOptions.map((assignee) => (
                    <option key={assignee.email} value={assignee.email}>
                      {assignee.name} {assignee.role ? `- ${assignee.role}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">{t("crmTasksPage.addTaskModal.description")}</label>
                <textarea
                  value={taskDescription}
                  onChange={(event) => setTaskDescription(event.target.value)}
                  rows={5}
                  className="block w-full px-4 py-3 text-base border border-slate-700 rounded-xl bg-[#151521] text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder={t("crmTasksPage.addTaskModal.descriptionPlaceholder")}
                />
              </div>

              <div className="pt-4 border-t border-slate-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAddTaskModal}
                  className="px-5 py-2.5 rounded-lg border border-slate-600 bg-[#151521] text-slate-200 hover:bg-slate-700/40 text-sm font-semibold"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isAddingTask}
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isAddingTask ? t("crmTasksPage.addTaskModal.saving") : t("crmTasksPage.addTaskModal.addTask")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showErrorToast ? (
        <div className="fixed bottom-5 right-5 z-[60] rounded-xl border border-rose-400/40 bg-[#29131a] px-4 py-3 shadow-xl max-w-sm">
          <p className="text-sm font-semibold text-rose-100">{t("crmTasksPage.errors.loadFailedToast")}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-2 text-xs font-semibold text-rose-200 hover:text-white underline"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
