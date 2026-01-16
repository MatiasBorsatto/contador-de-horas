import { useState, useEffect } from "react";
import { format, parseISO, addMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Pencil, Trash2, Clock, DollarSign, Settings as SettingsIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useWorkLogs,
  useWeeklySummary,
  useCreateWorkLog,
  useUpdateWorkLog,
  useDeleteWorkLog
} from "@/hooks/use-work-logs";
import { WeekSelector } from "@/components/WeekSelector";
import { WeeklySummary } from "@/components/WeeklySummary";
import { WorkLogForm } from "@/components/WorkLogForm";
import { PersistentCalculator } from "@/components/PersistentCalculator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api, buildUrl } from "@shared/routes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InsertWorkLog, WorkLog } from "@shared/schema";

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Settings
  const { data: hourlyRateSetting } = useQuery({
    queryKey: [buildUrl(api.settings.get.path, { key: "defaultHourlyRate" })],
  });

  const updateRateMutation = useMutation({
    mutationFn: async (newValue: string) => {
      const res = await fetch(buildUrl(api.settings.update.path, { key: "defaultHourlyRate" }), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [buildUrl(api.settings.get.path, { key: "defaultHourlyRate" })] });
      toast({ title: "Éxito", description: "Tarifa predeterminada actualizada." });
      setIsSettingsOpen(false);
    }
  });

  const defaultHourlyRate = (hourlyRateSetting as any)?.value ? Number((hourlyRateSetting as any).value) : 3500;
  
  // Data Fetching
  const { data: logs, isLoading: logsLoading } = useWorkLogs(currentDate);
  const { data: summary, isLoading: summaryLoading } = useWeeklySummary(currentDate);

  // Mutations
  const createMutation = useCreateWorkLog();
  const updateMutation = useUpdateWorkLog();
  const deleteMutation = useDeleteWorkLog();

  const handleCreate = async (data: InsertWorkLog) => {
    try {
      await createMutation.mutateAsync(data);
      setIsAddOpen(false);
      toast({ title: "Éxito", description: "Registro de trabajo creado con éxito." });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Error al crear el registro", 
        variant: "destructive" 
      });
    }
  };

  const handleUpdate = async (data: InsertWorkLog) => {
    if (!editingLog) return;
    try {
      await updateMutation.mutateAsync({ id: editingLog.id, ...data });
      setEditingLog(null);
      toast({ title: "Éxito", description: "Registro de trabajo actualizado con éxito." });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Error al actualizar el registro", 
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingLogId) return;
    try {
      await deleteMutation.mutateAsync(deletingLogId);
      setDeletingLogId(null);
      toast({ title: "Eliminado", description: "El registro de trabajo ha sido eliminado." });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Error al eliminar el registro", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900">
              Control de Horas
            </h1>
            <p className="text-muted-foreground">Gestiona tus horas de trabajo y ganancias.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <WeekSelector currentDate={currentDate} onDateChange={setCurrentDate} />
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="outline"
                onClick={() => setIsSettingsOpen(true)}
                className="rounded-xl"
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
              <Button 
                onClick={() => setIsAddOpen(true)}
                className="flex-1 sm:flex-none rounded-xl bg-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                <Plus className="mr-2 h-4 w-4" /> Agregar Registro
              </Button>
            </div>
          </div>
        </header>

        {/* Summary Section */}
        <section>
          <WeeklySummary summary={summary} isLoading={summaryLoading} />
        </section>

        {/* Logs List */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-display font-semibold text-slate-800">Registros de Trabajo</h2>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {logs?.length || 0} Entradas
            </span>
          </div>

          <div className="divide-y divide-slate-50">
            {logsLoading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando registros...</div>
            ) : logs?.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-slate-900">No hay registros para esta semana</h3>
                <p className="text-sm text-muted-foreground">Comienza agregando tu primer registro de trabajo.</p>
                <Button variant="ghost" onClick={() => setIsAddOpen(true)} className="text-primary">
                  Agregar entrada ahora
                </Button>
              </div>
            ) : (
              logs?.map((log) => {
                // Parse date and correct for UTC offset to show intended local date
                const logDate = parseISO(log.date);
                const localDate = addMinutes(logDate, logDate.getTimezoneOffset());
                const createdDate = log.createdAt ? new Date(log.createdAt) : null;

                return (
                  <div 
                    key={log.id} 
                    className="group p-4 sm:px-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex flex-col items-center justify-center shrink-0 border border-blue-100">
                        <span className="text-[10px] font-bold uppercase">{format(localDate, 'MMM', { locale: es })}</span>
                        <span className="text-lg font-bold leading-none">{format(localDate, 'dd')}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900">
                            {log.startTime} - {log.endTime}
                          </h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {log.hoursWorked} hrs
                          </span>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            Tarifa: ARS {Number(log.hourlyRate).toLocaleString('es-AR', { minimumFractionDigits: 2 })}/hr
                            <span className="mx-1">•</span>
                            Total: ARS {(Number(log.hourlyRate) * Number(log.hoursWorked)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </p>
                          {createdDate && (
                            <p className="text-[10px] text-slate-400">
                              Creado el {format(createdDate, "d 'de' MMM, HH:mm", { locale: es })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setEditingLog(log)}
                        className="h-8 w-8 p-0 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                      >
                        <Pencil className="w-4 h-4 text-slate-400 hover:text-primary" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setDeletingLogId(log.id)}
                        className="h-8 w-8 p-0 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                      >
                        <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Configuración</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tarifa Predeterminada (ARS)</label>
              <Input 
                type="number" 
                defaultValue={defaultHourlyRate}
                onBlur={(e) => updateRateMutation.mutate(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Agregar Registro</DialogTitle>
          </DialogHeader>
          <WorkLogForm 
            onSubmit={handleCreate} 
            isLoading={createMutation.isPending} 
            onCancel={() => setIsAddOpen(false)}
            defaultValues={{
              date: format(currentDate, 'yyyy-MM-dd'),
              hourlyRate: defaultHourlyRate
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingLog} onOpenChange={(open) => !open && setEditingLog(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Editar Registro</DialogTitle>
          </DialogHeader>
          {editingLog && (
            <WorkLogForm 
              defaultValues={{
                date: editingLog.date,
                startTime: editingLog.startTime,
                endTime: editingLog.endTime,
                hourlyRate: Number(editingLog.hourlyRate),
              }}
              onSubmit={handleUpdate} 
              isLoading={updateMutation.isPending} 
              onCancel={() => setEditingLog(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingLogId} onOpenChange={(open) => !open && setDeletingLogId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente esta entrada de tu control de horas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 rounded-xl"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <PersistentCalculator />
    </div>
  );
}
