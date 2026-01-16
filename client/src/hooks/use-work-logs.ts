import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type WorkLogInput, type WorkLogUpdateInput } from "@shared/routes";
import { format } from "date-fns";

export function useWorkLogs(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: [api.workLogs.listWeek.path, dateStr],
    queryFn: async () => {
      const url = buildUrl(api.workLogs.listWeek.path) + `?date=${dateStr}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch work logs");
      return api.workLogs.listWeek.responses[200].parse(await res.json());
    },
  });
}

export function useWeeklySummary(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');

  return useQuery({
    queryKey: [api.workLogs.getSummary.path, dateStr],
    queryFn: async () => {
      const url = buildUrl(api.workLogs.getSummary.path) + `?date=${dateStr}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch summary");
      return api.workLogs.getSummary.responses[200].parse(await res.json());
    },
  });
}

export function useCreateWorkLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: WorkLogInput) => {
      const res = await fetch(api.workLogs.create.path, {
        method: api.workLogs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.workLogs.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create work log");
      }
      
      return api.workLogs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workLogs.listWeek.path] });
      queryClient.invalidateQueries({ queryKey: [api.workLogs.getSummary.path] });
    },
  });
}

export function useUpdateWorkLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: WorkLogUpdateInput & { id: number }) => {
      const url = buildUrl(api.workLogs.update.path, { id });
      const res = await fetch(url, {
        method: api.workLogs.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.workLogs.update.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to update work log");
      }
      
      return api.workLogs.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workLogs.listWeek.path] });
      queryClient.invalidateQueries({ queryKey: [api.workLogs.getSummary.path] });
    },
  });
}

export function useDeleteWorkLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.workLogs.delete.path, { id });
      const res = await fetch(url, {
        method: api.workLogs.delete.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to delete work log");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workLogs.listWeek.path] });
      queryClient.invalidateQueries({ queryKey: [api.workLogs.getSummary.path] });
    },
  });
}
