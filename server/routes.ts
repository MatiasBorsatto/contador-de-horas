
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { startOfWeek, endOfWeek, format, parse, addDays, getDay, endOfMonth } from "date-fns";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Helper to get Monday-Sunday week range
  const getWeekRange = (dateStr?: string) => {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    // weekStartsOn: 1 means Monday
    const start = startOfWeek(targetDate, { weekStartsOn: 1 });
    const end = endOfWeek(targetDate, { weekStartsOn: 1 });
    return {
      startStr: format(start, 'yyyy-MM-dd'),
      endStr: format(end, 'yyyy-MM-dd'),
      start,
      end
    };
  };

  app.get(api.workLogs.listWeek.path, async (req, res) => {
    try {
      const { startStr, endStr } = getWeekRange(req.query.date as string);
      const logs = await storage.getWorkLogsByRange(startStr, endStr);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.workLogs.getSummary.path, async (req, res) => {
    try {
      const { startStr, endStr, start } = getWeekRange(req.query.date as string);
      const logs = await storage.getWorkLogsByRange(startStr, endStr);

      // Group by day (Mon-Sun)
      const daysMap = new Map<string, number>();
      
      // Initialize all 7 days with 0 hours
      for (let i = 0; i < 7; i++) {
        const d = addDays(start, i);
        const dateKey = format(d, 'yyyy-MM-dd');
        daysMap.set(dateKey, 0);
      }

      let totalWeeklyHours = 0;
      let totalPay = 0;

      logs.forEach(log => {
        const hours = parseFloat(log.hoursWorked);
        const currentDayTotal = daysMap.get(log.date) || 0;
        daysMap.set(log.date, currentDayTotal + hours);

        totalWeeklyHours += hours;
        
        if (log.hourlyRate) {
          totalPay += hours * parseFloat(log.hourlyRate);
        }
      });

      const days = Array.from(daysMap.entries()).map(([date, totalHours]) => {
        return {
          date,
          dayName: format(new Date(date), 'EEE'),
          totalHours: Number(totalHours.toFixed(2))
        };
      });

      // Calculate Quincenal Summary
      const targetDate = req.query.date ? new Date(req.query.date as string) : new Date();
      const isFirstQuincena = targetDate.getDate() <= 15;
      const qStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), isFirstQuincena ? 1 : 16);
      const qEnd = isFirstQuincena 
        ? new Date(targetDate.getFullYear(), targetDate.getMonth(), 15)
        : endOfMonth(targetDate);
      
      const qLogs = await storage.getWorkLogsByRange(format(qStart, 'yyyy-MM-dd'), format(qEnd, 'yyyy-MM-dd'));
      
      let quincenaHours = 0;
      let quincenaPay = 0;
      qLogs.forEach(log => {
        const h = parseFloat(log.hoursWorked);
        quincenaHours += h;
        if (log.hourlyRate) quincenaPay += h * parseFloat(log.hourlyRate);
      });

      res.json({
        startDate: startStr,
        endDate: endStr,
        days,
        totalWeeklyHours: Number(totalWeeklyHours.toFixed(2)),
        totalPay: Number(totalPay.toFixed(2)),
        quincenaLabel: isFirstQuincena ? "1ra Quincena" : "2da Quincena",
        quincenaHours: Number(quincenaHours.toFixed(2)),
        quincenaPay: Number(quincenaPay.toFixed(2))
      });

    } catch (error) {
      console.error("Summary error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.workLogs.create.path, async (req, res) => {
    try {
      const input = api.workLogs.create.input.parse(req.body);
      
      // Validate end time > start time
      const start = parse(input.startTime, 'HH:mm', new Date());
      const end = parse(input.endTime, 'HH:mm', new Date());
      if (end <= start) {
        return res.status(400).json({ message: "End time must be after start time", field: "endTime" });
      }

      const log = await storage.createWorkLog(input);
      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put(api.workLogs.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.workLogs.update.input.parse(req.body);

      // If updating times, validate relation
      if (input.startTime || input.endTime) {
        const existing = await storage.getWorkLog(id);
        if (!existing) return res.status(404).json({ message: "Work log not found" });

        const sTime = input.startTime || existing.startTime;
        const eTime = input.endTime || existing.endTime;
        const start = parse(sTime, 'HH:mm', new Date());
        const end = parse(eTime, 'HH:mm', new Date());
        
        if (end <= start) {
          return res.status(400).json({ message: "End time must be after start time" });
        }
      }

      const updated = await storage.updateWorkLog(id, input);
      if (!updated) {
        return res.status(404).json({ message: "Work log not found" });
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.workLogs.delete.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getWorkLog(id);
      if (!existing) return res.status(404).json({ message: "Work log not found" });
      
      await storage.deleteWorkLog(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.settings.get.path, async (req, res) => {
    const value = await storage.getSetting(req.params.key);
    if (value === undefined) return res.status(404).json({ message: "Setting not found" });
    res.json({ key: req.params.key, value });
  });

  app.put(api.settings.update.path, async (req, res) => {
    const { value } = api.settings.update.input.parse(req.body);
    await storage.updateSetting(req.params.key, value);
    res.json({ key: req.params.key, value });
  });

  // Seed data if empty
  const existing = await storage.getWorkLogsByRange('2000-01-01', '2100-01-01');
  if (existing.length === 0) {
    console.log("Seeding database...");
    
    // Default hourly rate
    await storage.updateSetting('defaultHourlyRate', '3500');

    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    
    const seedLogs = [
      { date: format(addDays(monday, 0), 'yyyy-MM-dd'), startTime: '09:00', endTime: '17:00', hourlyRate: 20 },
      { date: format(addDays(monday, 1), 'yyyy-MM-dd'), startTime: '09:00', endTime: '18:00', hourlyRate: 20 }, // 9 hours
      { date: format(addDays(monday, 2), 'yyyy-MM-dd'), startTime: '10:00', endTime: '16:00', hourlyRate: 20 }, // 6 hours
    ];

    for (const log of seedLogs) {
      // Manual creation to ensure calculation
      // We can use the storage method
       // We need to match InsertWorkLog type. startTime/endTime are strings. hourlyRate is number/string.
      await storage.createWorkLog(log);
    }
  }

  return httpServer;
}
