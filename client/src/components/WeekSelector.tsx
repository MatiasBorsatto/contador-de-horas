import { Button } from "@/components/ui/button";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useEffect } from "react";

interface WeekSelectorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function WeekSelector({ currentDate, onDateChange }: WeekSelectorProps) {
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });

  useEffect(() => {
    // Force a re-render or side effect if needed, but standard React state should handle it.
    // Ensure onDateChange is stable if passed from parent.
  }, [currentDate]);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-border/50 shadow-sm w-full sm:w-auto overflow-hidden">
      <div className="flex items-center gap-2 w-full justify-between sm:justify-start">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const next = subWeeks(currentDate, 1);
            onDateChange(next);
          }}
          className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex flex-col items-center px-2 flex-1 min-w-0">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            Semana Actual
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto p-0 font-display text-base sm:text-lg font-bold hover:bg-transparent hover:text-primary transition-colors truncate w-full"
              >
                <span className="truncate">
                  {format(startDate, "d 'de' MMM", { locale: es })} - {format(endDate, "d 'de' MMM, yyyy", { locale: es })}
                </span>
                <CalendarIcon className="ml-2 h-4 w-4 text-muted-foreground shrink-0 hidden sm:inline" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl" align="center">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && onDateChange(date)}
                initialFocus
                locale={es}
                className="rounded-xl border shadow-lg"
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const next = addWeeks(currentDate, 1);
            onDateChange(next);
          }}
          className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
