import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkLogSchema, type InsertWorkLog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useEffect } from "react";

interface WorkLogFormProps {
  defaultValues?: Partial<InsertWorkLog>;
  onSubmit: (data: InsertWorkLog) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
}

export function WorkLogForm({ defaultValues, onSubmit, isLoading, onCancel }: WorkLogFormProps) {
  const form = useForm<InsertWorkLog>({
    resolver: zodResolver(insertWorkLogSchema),
    defaultValues: {
      date: defaultValues?.date || format(new Date(), "yyyy-MM-dd"),
      startTime: defaultValues?.startTime || "09:00",
      endTime: defaultValues?.endTime || "17:00",
      hourlyRate: defaultValues?.hourlyRate || 50,
    },
  });

  const handleSubmit = async (data: InsertWorkLog) => {
    // Basic client-side validation for time
    const start = new Date(`2000-01-01T${data.startTime}`);
    const end = new Date(`2000-01-01T${data.endTime}`);
    
    if (end <= start) {
      form.setError("endTime", {
        type: "manual",
        message: "La hora de fin debe ser posterior a la de inicio",
      });
      return;
    }

    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha</FormLabel>
              <FormControl>
                <Input type="date" {...field} className="rounded-xl border-border/60" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora Inicio</FormLabel>
                <FormControl>
                  <Input type="time" {...field} className="rounded-xl border-border/60" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora Fin</FormLabel>
                <FormControl>
                  <Input type="time" {...field} className="rounded-xl border-border/60" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="hourlyRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tarifa por Hora (ARS)</FormLabel>
              <FormControl>
                <Input type="number" step="0.50" {...field} className="rounded-xl border-border/60" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="rounded-xl bg-primary hover:bg-primary/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Registro
          </Button>
        </div>
      </form>
    </Form>
  );
}
