import { WeeklySummary as WeeklySummaryType } from "@shared/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Clock, TrendingUp } from "lucide-react";
import { es } from "date-fns/locale";

interface WeeklySummaryProps {
  summary?: WeeklySummaryType;
  isLoading: boolean;
}

export function WeeklySummary({ summary, isLoading }: WeeklySummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        <div className="h-32 bg-muted rounded-2xl"></div>
        <div className="h-32 bg-muted rounded-2xl"></div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-none shadow-lg shadow-indigo-500/5 bg-gradient-to-br from-indigo-500 to-blue-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <DollarSign className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-indigo-100 font-medium text-sm uppercase tracking-wider flex items-center gap-2">
              Semanal (ARS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">
              ARS {summary.totalPay.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-indigo-100 text-xs mt-1 opacity-80">
              {summary.totalWeeklyHours.toFixed(1)} hrs totales
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-lg shadow-emerald-500/5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <DollarSign className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-100 font-medium text-sm uppercase tracking-wider flex items-center gap-2">
              {summary.quincenaLabel || 'Quincenal'} (ARS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">
              ARS {(summary.quincenaPay || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-emerald-100 text-xs mt-1 opacity-80">
              {(summary.quincenaHours || 0).toFixed(1)} hrs totales
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-lg shadow-slate-500/5 bg-white overflow-hidden relative group hidden lg:block">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500 text-slate-500">
            <Clock className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground font-medium text-sm uppercase tracking-wider flex items-center gap-2">
              Días Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-foreground">
              {summary.days.filter(d => d.totalHours > 0).length}
              <span className="text-lg text-muted-foreground font-normal ml-1">días</span>
            </div>
          </CardContent>
        </Card>
        
        <div className="hidden md:flex flex-col justify-center p-4 rounded-2xl border border-dashed border-border bg-white/50 text-center">
          <TrendingUp className="w-6 h-6 mx-auto text-primary mb-1 opacity-50" />
          <h3 className="text-xs font-medium text-muted-foreground">Vista Semanal</h3>
          <div className="flex justify-between items-end gap-1 h-10 mt-2 px-2">
            {summary.days.map((day, i) => {
              const spanishDayNames: Record<string, string> = {
                'Mon': 'L', 'Tue': 'M', 'Wed': 'M', 'Thu': 'J', 'Fri': 'V', 'Sat': 'S', 'Sun': 'D'
              };
              return (
                <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                  <div 
                    className={`w-full rounded-t-sm transition-all duration-500 ${day.totalHours > 0 ? 'bg-primary' : 'bg-muted'}`}
                    style={{ height: `${Math.min((day.totalHours / 12) * 100, 100)}%` }}
                  ></div>
                  <span className="text-[8px] text-muted-foreground font-medium">{spanishDayNames[day.dayName] || day.dayName.charAt(0)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
