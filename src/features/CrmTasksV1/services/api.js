import axios from "axios";
import {
  MOCK_TASKS,
  getTaskTypeKeyFromTask,
  normalizeTaskTypeKey,
} from "../data/mockTasks";

const NETWORK_DELAY_MS = 220;

const httpClient = axios.create({
  baseURL: "/api/crm/tasks-v1",
});

let customTasksStore = [];
const taskOverridesById = new Map();

const CLIENT_AVATAR_THEMES = ["bg-indigo-500", "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-cyan-500"];

const getInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "NA";
};

const normalizeTaskStatus = (status) => {
  const normalized = String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  if (!normalized) {
    return "PENDING";
  }

  if (normalized === "IN_PROGRESS" || normalized === "PENDING" || normalized === "DONE" || normalized === "OVERDUE") {
    return normalized;
  }

  return "PENDING";
};

const toIsoString = (value) => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
};

const orderByNewest = (left, right) => {
  const leftDate = new Date(left?.createdAt || left?.created).getTime();
  const rightDate = new Date(right?.createdAt || right?.created).getTime();

  return rightDate - leftDate;
};

const applyTaskOverrides = (task) => {
  const override = taskOverridesById.get(String(task.id));
  return override ? { ...task, ...override } : task;
};

const getAllTasks = () => [...customTasksStore, ...MOCK_TASKS].map(applyTaskOverrides).sort(orderByNewest);

const mapTaskToListItem = (task) => ({
  id: task.id,
  client: {
    id: task.client?.accountId || task.client?.id || "",
    name: task.client?.name || "N/A",
    email: task.client?.email || "N/A",
  },
  taskType: getTaskTypeKeyFromTask(task),
  status: normalizeTaskStatus(task.status),
  assignee: {
    name: task.assignee?.name || "N/A",
    role: task.assignee?.role || "N/A",
    initials: task.assignee?.initials || "NA",
    color: task.assignee?.color || "bg-slate-500",
    email: task.assignee?.email || "",
  },
  createdAt: toIsoString(task.createdAt || task.created),
  dueDate: toIsoString(task.dueDate || task.due),
});

const buildPagedResponse = ({ collection, page, perPage }) => {
  const normalizedPerPage = Number(perPage) > 0 ? Number(perPage) : 20;
  const totalItems = collection.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPerPage));
  const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const start = (safePage - 1) * normalizedPerPage;

  return {
    items: collection.slice(start, start + normalizedPerPage).map(mapTaskToListItem),
    page: safePage,
    perPage: normalizedPerPage,
    totalItems,
    totalPages,
  };
};

const matchSearch = (task, searchTerm) => {
  const normalizedSearch = String(searchTerm || "").trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  const blob = `${task.client?.name || ""} ${task.client?.email || ""}`.toLowerCase();
  return blob.includes(normalizedSearch);
};

const matchTaskType = (task, taskType) => {
  const normalizedFilterType = normalizeTaskTypeKey(taskType);

  if (!normalizedFilterType) {
    return true;
  }

  return getTaskTypeKeyFromTask(task) === normalizedFilterType;
};

const matchStatus = (task, status) => {
  const normalizedFilterStatus = normalizeTaskStatus(status);

  if (!status) {
    return true;
  }

  return normalizeTaskStatus(task.status) === normalizedFilterStatus;
};

const getAssigneeOptions = () => Array.from(
  new Map(
    getAllTasks()
      .map((task) => task.assignee)
      .filter((assignee) => assignee && assignee.email)
      .map((assignee) => [assignee.email, assignee])
  ).values()
);

const getTaskTypeOptions = () => Array.from(new Set(getAllTasks().map((task) => getTaskTypeKeyFromTask(task)).filter(Boolean)));

const createCustomTaskDraft = ({ assignedTo, description }) => {
  const assignee = getAssigneeOptions().find((entry) => entry.email === assignedTo);

  if (!assignee) {
    throw new Error("Assignee does not exist.");
  }

  const normalizedDescription = String(description || "").trim();
  if (!normalizedDescription || normalizedDescription.length < 6) {
    throw new Error("Description is required and should be at least 6 characters.");
  }

  const maxId = getAllTasks().reduce((result, task) => {
    const numericId = Number(task.id);
    return Number.isFinite(numericId) ? Math.max(result, numericId) : result;
  }, 0);
  const nextId = maxId + 1;

  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 7);

  const clientName = `New Client ${nextId}`;

  return {
    id: nextId,
    client: {
      name: clientName,
      email: `client.${nextId}@crm.local`,
      phone: "N/A",
      initials: getInitials(clientName),
      color: CLIENT_AVATAR_THEMES[nextId % CLIENT_AVATAR_THEMES.length],
      company: "N/A",
      accountId: `c${nextId}`,
      country: "N/A",
      address: "N/A",
      industry: "N/A",
      joinedAt: now.toISOString(),
    },
    type: "CustomTask",
    status: "PENDING",
    priority: "Medium",
    assignee: {
      name: assignee.name,
      role: assignee.role || "Team Member",
      initials: assignee.initials || getInitials(assignee.name),
      color: assignee.color || "bg-indigo-500",
      email: assignee.email,
    },
    created: now.toISOString(),
    due: dueDate.toISOString(),
    isOverdue: false,
    description: normalizedDescription,
    timeline: [
      {
        title: "Task created",
        at: now.toISOString(),
        note: normalizedDescription,
      },
    ],
    actions: ["Open Task Details"],
  };
};

const createMockAdapter = (producer, status = 200) => async (config) => {
  await new Promise((resolve) => {
    setTimeout(resolve, NETWORK_DELAY_MS);
  });

  const data = await producer(config);

  return {
    data,
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "ERROR",
    headers: {},
    config,
  };
};

export const crmTasksApi = {
  async getTaskList({ search = "", taskType = "", status = "", page = 1, perPage = 20 } = {}) {
    const response = await httpClient.get("/tasks", {
      params: { search, taskType, status, page, perPage },
      adapter: createMockAdapter((config) => {
        const query = config.params || {};
        const filteredCollection = getAllTasks().filter(
          (task) =>
            matchSearch(task, query.search)
            && matchTaskType(task, query.taskType)
            && matchStatus(task, query.status)
        );

        return buildPagedResponse({
          collection: filteredCollection,
          page: query.page,
          perPage: query.perPage,
        });
      }),
    });

    return response.data;
  },

  async getTaskById(taskId) {
    const response = await httpClient.get(`/tasks/${taskId}`, {
      adapter: createMockAdapter(() => {
        const task = getAllTasks().find((entry) => String(entry.id) === String(taskId));
        if (!task) {
          throw new Error("Task was not found.");
        }

        return task;
      }),
    });

    return response.data;
  },

  async getTasksByClient(clientId) {
    const response = await httpClient.get(`/clients/${clientId}/tasks`, {
      adapter: createMockAdapter(() =>
        getAllTasks().filter((task) => String(task.client?.accountId) === String(clientId))
      ),
    });

    return response.data;
  },

  async getClientById(clientId) {
    const response = await httpClient.get(`/clients/${clientId}`, {
      adapter: createMockAdapter(() => {
        const task = getAllTasks().find((entry) => String(entry.client?.accountId) === String(clientId));
        if (!task?.client) {
          throw new Error("Client was not found.");
        }

        return task.client;
      }),
    });

    return response.data;
  },

  async createTask({ assignedTo, description }) {
    const response = await httpClient.post(
      "/tasks",
      { assignedTo, description },
      {
        adapter: createMockAdapter((config) => {
          const payload = typeof config.data === "string"
            ? JSON.parse(config.data)
            : config.data || {};
          const draft = createCustomTaskDraft(payload);
          customTasksStore = [draft, ...customTasksStore];
          return draft;
        }, 201),
      }
    );

    return response.data;
  },

  async markTaskAsDone(taskId) {
    const response = await httpClient.patch(
      `/tasks/${taskId}/mark-done`,
      {},
      {
        adapter: createMockAdapter(() => {
          const existingTask = getAllTasks().find((entry) => String(entry.id) === String(taskId));
          if (!existingTask) {
            throw new Error("Task was not found.");
          }

          let wasCustomTaskUpdated = false;

          customTasksStore = customTasksStore.map((task) => {
            if (String(task.id) !== String(taskId)) {
              return task;
            }

            wasCustomTaskUpdated = true;
            return {
              ...task,
              status: "DONE",
              isOverdue: false,
            };
          });

          if (!wasCustomTaskUpdated) {
            taskOverridesById.set(String(taskId), {
              status: "DONE",
              isOverdue: false,
            });
          }

          return { success: true };
        }),
      }
    );

    return response.data;
  },

  async getAssignees() {
    const response = await httpClient.get("/assignees", {
      adapter: createMockAdapter(() => getAssigneeOptions()),
    });

    return response.data;
  },

  async getTaskTypes() {
    const response = await httpClient.get("/task-types", {
      adapter: createMockAdapter(() => getTaskTypeOptions()),
    });

    return response.data;
  },
};
