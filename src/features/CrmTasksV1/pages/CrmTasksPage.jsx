import { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import {
  PAGE_SIZE_OPTIONS,
  formatIsoDateForDisplay,
  getStatusClasses,
  getStatusLabel,
  getTaskTypeLabel,
  getTypeClasses,
} from "../data/mockTasks";
import {
  useCreateCrmTask,
  useCrmAssignees,
  useCrmTaskList,
  useCrmTaskTypes,
  useMarkTaskAsDone,
} from "../hooks/useCrmTasks";
import { useI18n } from "../../../i18n/I18nProvider";
import TaskDetailsPage from "./TaskDetailsPage";

const CLIENT_AVATAR_THEMES = ["bg-indigo-500", "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-cyan-500"];
const ACTIONS_MENU_ESTIMATED_HEIGHT = 176;
const ACTIONS_MENU_VIEWPORT_PADDING = 16;

const getInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "NA";
};

export default function CrmTasksPage() {
  const { t, isRtl } = useI18n();
  const navigate = useNavigate();

  const [appliedFilters, setAppliedFilters] = useState({ search: "", taskType: "" });
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [openActionsTaskId, setOpenActionsTaskId] = useState(null);
  const [isActionsMenuOpenUpward, setIsActionsMenuOpenUpward] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [openTaskDetailsId, setOpenTaskDetailsId] = useState(null);

  const listQuery = useCrmTaskList({
    page: currentPage,
    perPage: rowsPerPage,
    search: appliedFilters.search,
    taskType: appliedFilters.taskType,
  });
  const assigneesQuery = useCrmAssignees();
  const taskTypesQuery = useCrmTaskTypes();
  const createTaskMutation = useCreateCrmTask();
  const markTaskAsDoneMutation = useMarkTaskAsDone();

  const uiState = listQuery.isPending ? "loading" : listQuery.isError ? "error" : "success";
  const listResponse = listQuery.data || {
    items: [],
    page: 1,
    perPage: rowsPerPage,
    totalItems: 0,
    totalPages: 1,
  };

  const totalItems = listResponse.totalItems;
  const totalPages = listResponse.totalPages;
  const paginatedTasks = listResponse.items;
  const assigneeOptions = assigneesQuery.data || [];
  const taskTypes = taskTypesQuery.data || [];
  const showEmptyState = uiState === "success" && totalItems === 0;

  const filtersFormik = useFormik({
    initialValues: {
      search: "",
      taskType: "",
    },
    onSubmit: (values) => {
      setAppliedFilters({
        search: String(values.search || "").trim(),
        taskType: values.taskType || "",
      });
      setCurrentPage(1);
    },
  });

  const addTaskValidationSchema = useMemo(
    () => Yup.object({
      assignedToEmail: Yup.string().required(t("crmTasksPage.errors.requiredFields")),
      taskDescription: Yup.string()
        .trim()
        .min(6, t("crmTasksPage.errors.requiredFields"))
        .required(t("crmTasksPage.errors.requiredFields")),
    }),
    [t]
  );

  const addTaskFormik = useFormik({
    initialValues: {
      assignedToEmail: "",
      taskDescription: "",
    },
    validationSchema: addTaskValidationSchema,
    onSubmit: async (values, helpers) => {
      try {
        await createTaskMutation.mutateAsync({
          assignedTo: values.assignedToEmail,
          description: values.taskDescription,
        });

        helpers.resetForm();
        helpers.setStatus(undefined);
        setIsAddTaskModalOpen(false);
        setCurrentPage(1);
      } catch (error) {
        helpers.setStatus(error?.message || t("crmTasksPage.errors.saveFailed"));
      }
    },
  });

  const closeAddTaskModal = () => {
    setIsAddTaskModalOpen(false);
    addTaskFormik.resetForm();
    addTaskFormik.setStatus(undefined);
  };

  const openAddTaskModal = () => {
    setOpenActionsTaskId(null);
    setIsActionsMenuOpenUpward(false);
    setOpenTaskDetailsId(null);
    addTaskFormik.resetForm();
    addTaskFormik.setStatus(undefined);
    setIsAddTaskModalOpen(true);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilters.search, appliedFilters.taskType, rowsPerPage]);

  useEffect(() => {
    if (listResponse.page !== currentPage) {
      setCurrentPage(listResponse.page);
    }
  }, [listResponse.page, currentPage]);

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
        closeAddTaskModal();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isAddTaskModalOpen]);

  const handleRetry = () => {
    setShowErrorToast(false);
    listQuery.refetch();
  };

  const clearFilters = () => {
    filtersFormik.resetForm();
    setAppliedFilters({ search: "", taskType: "" });
    setCurrentPage(1);
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

  const handleMarkAsDone = async (taskId) => {
    try {
      await markTaskAsDoneMutation.mutateAsync(taskId);
    } catch {
      setShowErrorToast(true);
    } finally {
      setOpenActionsTaskId(null);
      setIsActionsMenuOpenUpward(false);
    }
  };

  const addTaskError = addTaskFormik.status
    || (addTaskFormik.submitCount > 0
      ? addTaskFormik.errors.assignedToEmail || addTaskFormik.errors.taskDescription
      : "");

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

        <div className="bg-[#1e1e2d] rounded-2xl shadow-lg border border-slate-700 overflow-hidden">
          <div className="p-6 pb-4 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white leading-tight">{t("crmTasksPage.allTasks")}</h2>
            <p className="text-sm text-slate-300 mb-5">{t("crmTasksPage.tasksFound", { count: totalItems }, `${totalItems} tasks found`)}</p>

            <form onSubmit={filtersFormik.handleSubmit} className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
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
                  name="search"
                  value={filtersFormik.values.search}
                  onChange={filtersFormik.handleChange}
                  type="text"
                  className="block w-full pl-11 pr-32 py-3 border border-slate-700 rounded-xl bg-[#151521] hover:bg-[#1a1a27] focus:bg-[#1a1a27] placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base text-slate-100 transition-colors"
                  placeholder={t("crmTasksPage.searchPlaceholder")}
                />
                <button
                  type="submit"
                  className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? "left-2" : "right-2"} inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>{t("crmTasksPage.buttons.search", null, "Search")}</span>
                </button>
              </div>

              <div className="flex gap-3 w-full lg:w-auto">
                <select
                  name="taskType"
                  value={filtersFormik.values.taskType}
                  onChange={(event) => {
                    const nextType = event.target.value;
                    filtersFormik.setFieldValue("taskType", nextType);
                    setAppliedFilters({
                      search: String(filtersFormik.values.search || "").trim(),
                      taskType: nextType,
                    });
                    setCurrentPage(1);
                  }}
                  className="block w-full lg:w-48 pl-4 pr-10 py-3 text-base border border-slate-700 rounded-xl bg-[#151521] text-slate-200 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t("crmTasksPage.taskTypeFilter")}</option>
                  {taskTypes.map((typeKey) => (
                    <option key={typeKey} value={typeKey}>
                      {getTaskTypeLabel(typeKey)}
                    </option>
                  ))}
                </select>
              </div>
            </form>
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
                      const taskTypeLabel = getTaskTypeLabel(task.taskType);
                      const typeClasses = getTypeClasses(task.taskType);
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
                                  navigate(`/crm/tasks-v1/profile/${task.client.id}`);
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
                                  setOpenTaskDetailsId(task.id);
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
                                      setOpenTaskDetailsId(task.id);
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
                                      navigate(`/crm/tasks-v1/profile/${task.client.id}`);
                                    }}
                                    className="block w-full text-start px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/45"
                                  >
                                    {t("crmTasksPage.buttons.openClientProfile")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkAsDone(task.id)}
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

      {openTaskDetailsId ? (
        <TaskDetailsPage
          taskId={openTaskDetailsId}
          isModal
          onClose={() => setOpenTaskDetailsId(null)}
          onOpenClientProfile={(clientId) => {
            setOpenTaskDetailsId(null);
            navigate(`/crm/tasks-v1/profile/${clientId}`);
          }}
        />
      ) : null}

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

            <form onSubmit={addTaskFormik.handleSubmit} className="px-6 py-5 space-y-5">
              {addTaskError ? (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/15 px-4 py-2.5 text-sm text-rose-200">
                  {addTaskError}
                </div>
              ) : null}

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">{t("crmTasksPage.addTaskModal.assignedTo")}</label>
                <select
                  name="assignedToEmail"
                  value={addTaskFormik.values.assignedToEmail}
                  onChange={addTaskFormik.handleChange}
                  onBlur={addTaskFormik.handleBlur}
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
                  name="taskDescription"
                  value={addTaskFormik.values.taskDescription}
                  onChange={addTaskFormik.handleChange}
                  onBlur={addTaskFormik.handleBlur}
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
                  disabled={createTaskMutation.isPending || addTaskFormik.isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {createTaskMutation.isPending || addTaskFormik.isSubmitting
                    ? t("crmTasksPage.addTaskModal.saving")
                    : t("crmTasksPage.addTaskModal.addTask")}
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
