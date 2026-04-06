import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crmTasksApi } from "../services/api";

export const crmTasksQueryKeys = {
  root: ["crmTasksV1"],
  listScope: () => [...crmTasksQueryKeys.root, "task-list"],
  list: ({ page = 1, perPage = 20, search = "", taskType = "", status = "" } = {}) => [
    ...crmTasksQueryKeys.listScope(),
    page,
    perPage,
    search,
    taskType,
    status,
  ],
  task: (taskId) => [...crmTasksQueryKeys.root, "task", String(taskId)],
  client: (clientId) => [...crmTasksQueryKeys.root, "client", String(clientId)],
  clientTasks: (clientId) => [...crmTasksQueryKeys.root, "client-tasks", String(clientId)],
  assignees: () => [...crmTasksQueryKeys.root, "assignees"],
  taskTypes: () => [...crmTasksQueryKeys.root, "task-types"],
};

export function useCrmTaskList(params) {
  return useQuery({
    queryKey: crmTasksQueryKeys.list(params),
    queryFn: () => crmTasksApi.getTaskList(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCrmTaskDetails(taskId) {
  return useQuery({
    queryKey: crmTasksQueryKeys.task(taskId),
    queryFn: () => crmTasksApi.getTaskById(taskId),
    enabled: Boolean(taskId),
  });
}

export function useCrmClient(clientId) {
  return useQuery({
    queryKey: crmTasksQueryKeys.client(clientId),
    queryFn: () => crmTasksApi.getClientById(clientId),
    enabled: Boolean(clientId),
  });
}

export function useCrmClientTasks(clientId) {
  return useQuery({
    queryKey: crmTasksQueryKeys.clientTasks(clientId),
    queryFn: () => crmTasksApi.getTasksByClient(clientId),
    enabled: Boolean(clientId),
  });
}

export function useCrmAssignees() {
  return useQuery({
    queryKey: crmTasksQueryKeys.assignees(),
    queryFn: () => crmTasksApi.getAssignees(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCrmTaskTypes() {
  return useQuery({
    queryKey: crmTasksQueryKeys.taskTypes(),
    queryFn: () => crmTasksApi.getTaskTypes(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCrmTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => crmTasksApi.createTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmTasksQueryKeys.listScope() });
      queryClient.invalidateQueries({ queryKey: crmTasksQueryKeys.assignees() });
      queryClient.invalidateQueries({ queryKey: crmTasksQueryKeys.taskTypes() });
    },
  });
}

export function useMarkTaskAsDone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId) => crmTasksApi.markTaskAsDone(taskId),
    onSuccess: (_data, taskId) => {
      queryClient.invalidateQueries({ queryKey: crmTasksQueryKeys.listScope() });
      queryClient.invalidateQueries({ queryKey: crmTasksQueryKeys.task(taskId) });
      queryClient.invalidateQueries({ queryKey: [...crmTasksQueryKeys.root, "client-tasks"] });
      queryClient.invalidateQueries({ queryKey: [...crmTasksQueryKeys.root, "client"] });
    },
  });
}
