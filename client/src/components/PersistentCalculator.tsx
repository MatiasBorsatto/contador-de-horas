import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Calculator, RotateCcw } from "lucide-react";

export function PersistentCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState(() => localStorage.getItem("calc_display") || "0");
  const [history, setHistory] = useState(() => localStorage.getItem("calc_history") || "");

  useEffect(() => {
    localStorage.setItem("calc_display", display);
    localStorage.setItem("calc_history", history);
  }, [display, history]);

  const handleDigit = (digit: string) => {
    setDisplay(prev => prev === "0" ? digit : prev + digit);
  };

  const handleOp = (op: string) => {
    setDisplay(prev => prev + " " + op + " ");
  };

  const calculate = () => {
    try {
      // Basic calculation
      const result = eval(display.replace(/x/g, "*"));
      setHistory(display + " = " + result);
      setDisplay(String(result));
    } catch (e) {
      setDisplay("Error");
    }
  };

  const clear = () => {
    setDisplay("0");
    setHistory("");
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-indigo-600 hover:bg-indigo-700 text-white z-50"
      >
        <Calculator className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-72 shadow-2xl z-50 rounded-2xl border-indigo-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <CardHeader className="bg-indigo-600 text-white p-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calculator className="h-4 w-4" /> Calculadora
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(false)} 
          className="h-8 w-8 text-white hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 bg-slate-50">
        <div className="bg-white p-3 rounded-xl border border-slate-200 mb-4 text-right">
          <div className="text-[10px] text-slate-400 h-4 overflow-hidden truncate">{history}</div>
          <div className="text-2xl font-bold font-mono truncate">{display}</div>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {["7", "8", "9", "/"].map(v => (
            <Button key={v} onClick={() => v === "/" ? handleOp("/") : handleDigit(v)} variant="outline" className="h-10 rounded-lg">{v}</Button>
          ))}
          {["4", "5", "6", "*"].map(v => (
            <Button key={v} onClick={() => v === "*" ? handleOp("x") : handleDigit(v)} variant="outline" className="h-10 rounded-lg">{v === "*" ? "x" : v}</Button>
          ))}
          {["1", "2", "3", "-"].map(v => (
            <Button key={v} onClick={() => v === "-" ? handleOp("-") : handleDigit(v)} variant="outline" className="h-10 rounded-lg">{v}</Button>
          ))}
          {["0", ".", "=", "+"].map(v => (
            <Button 
              key={v} 
              onClick={() => v === "=" ? calculate() : v === "+" ? handleOp("+") : handleDigit(v)} 
              variant={v === "=" ? "default" : "outline"} 
              className={`h-10 rounded-lg ${v === "=" ? "bg-indigo-600" : ""}`}
            >
              {v}
            </Button>
          ))}
          <Button onClick={clear} variant="ghost" className="col-span-4 h-10 rounded-lg text-slate-500">
            <RotateCcw className="h-4 w-4 mr-2" /> Limpiar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}