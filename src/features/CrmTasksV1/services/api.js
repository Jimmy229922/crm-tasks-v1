import {
  ASSIGNEES,
  LOCAL_STORAGE_KEY,
  MOCK_TASKS,
  createCustomTaskDraft,
} from "../data/mockTasks";

const NETWORK_DELAY_MS = 260;

const sleep = (duration) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

const canUseStorage =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

const normalizeTask = (task) => {
  if (!task || typeof task !== "object") {
    return null;
  }

  const {
    id,
    client,
    taskType,
    status,
    assignee,
    createdAt,
    dueDate,
    description,
    notes,
    timeline,
    history,
    recordSummary,
    financialData,
    relatedData,
  } = task;

  if (!id || !client || !taskType || !status || !assignee || !createdAt) {
    return null;
  }

  return {
    id,
    client,
    taskType,
    status,
    assignee,
    createdAt,
    dueDate: dueDate ?? null,
    description: description ?? "",
    notes: Array.isArray(notes) ? notes : [],
    timeline: Array.isArray(timeline) ? timeline : [],
    history: Array.isArray(history) ? history : [],
    recordSummary: recordSummary ?? {
      riskLevel: "N/A",
      nextStep: "N/A",
      dueHealth: "N/A",
      lastUpdatedAt: createdAt,
    },
    financialData,
    relatedData,
  };
};

const readCustomTasks = () => {
  if (!canUseStorage) {
    return [];
  }

  const rawValue = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  const parsed = safeJsonParse(rawValue);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.map(normalizeTask).filter(Boolean);
};

const writeCustomTasks = (tasks) => {
  if (!canUseStorage) {
    return;
  }

  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
};

const toListItem = (task) => ({
  id: task.id,
  client: task.client,
  taskType: task.taskType,
  status: task.status,
  assignee: task.assignee,
  createdAt: task.createdAt,
  dueDate: task.dueDate,
});

const orderByNewest = (left, right) =>
  new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();

const getAllTasks = () => [...readCustomTasks(), ...MOCK_TASKS].sort(orderByNewest);

const matchSearch = (task, searchTerm) => {
  if (!searchTerm) {
    return true;
  }

  const normalizedTerm = searchTerm.trim().toLowerCase();
  const clientName = `${task.client?.name ?? ""}`.toLowerCase();
  const clientEmail = `${task.client?.email ?? ""}`.toLowerCase();
  return clientName.includes(normalizedTerm) || clientEmail.includes(normalizedTerm);
};

const matchTaskType = (task, taskType) => taskType === "ALL" || task.taskType === taskType;

const matchStatus = (task, status) => status === "ALL" || task.status === status;

const buildPagedResponse = ({ collection, page, perPage }) => {
  const normalizedPerPage = Number(perPage) > 0 ? Number(perPage) : 20;
  const totalItems = collection.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPerPage));
  const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const start = (safePage - 1) * normalizedPerPage;
  const items = collection.slice(start, start + normalizedPerPage).map(toListItem);

  return {
    items,
    page: safePage,
    perPage: normalizedPerPage,
    totalItems,
    totalPages,
  };
};

export const crmTasksApi = {
  async getTaskList({ search = "", taskType = "ALL", status = "ALL", page = 1, perPage = 20 } = {}) {
    await sleep(NETWORK_DELAY_MS);

    const filteredCollection = getAllTasks().filter(
      (task) => matchSearch(task, search) && matchTaskType(task, taskType) && matchStatus(task, status)
    );

    return buildPagedResponse({ collection: filteredCollection, page, perPage });
  },

  async getTaskMetrics() {
    await sleep(NETWORK_DELAY_MS / 2);

    const allTasks = getAllTasks();

    return {
      totalTasks: allTasks.length,
      inProgress: allTasks.filter((task) => task.status === "IN_PROGRESS").length,
      overdue: allTasks.filter((task) => task.status === "OVERDUE").length,
      completed: allTasks.filter((task) => task.status === "DONE").length,
    };
  },

  async getTaskById(taskId) {
    await sleep(NETWORK_DELAY_MS / 2);

    const task = getAllTasks().find((item) => item.id === taskId);
    if (!task) {
      throw new Error("Task was not found.");
    }

    return task;
  },

  async getTasksByClient(clientId) {
    await sleep(NETWORK_DELAY_MS / 2);

    return getAllTasks()
      .filter((task) => task.client?.id === clientId)
      .map(toListItem);
  },

  async createTask({ assignedTo, description }) {
    await sleep(NETWORK_DELAY_MS / 2);

    if (!assignedTo) {
      throw new Error("Assigned To is required.");
    }

    if (!description || description.trim().length < 6) {
      throw new Error("Description is required and should be at least 6 characters.");
    }

    const assigneeExists = ASSIGNEES.some((assignee) => assignee.id === assignedTo);
    if (!assigneeExists) {
      throw new Error("Assignee does not exist.");
    }

    const draft = createCustomTaskDraft({
      assigneeId: assignedTo,
      description: description.trim(),
    });

    const customTasks = readCustomTasks();
    customTasks.unshift(draft);
    writeCustomTasks(customTasks);

    return draft;
  },

  getAssignees() {
    return [...ASSIGNEES];
  },
};
