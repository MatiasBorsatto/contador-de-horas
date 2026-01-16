
import { db } from "./db";
import { workLogs, settings, type InsertWorkLog, type WorkLog } from "@shared/schema";
import { eq, and, gte, lte, asc, desc, sql } from "drizzle-orm";
import { startOfWeek, endOfWeek, format, addDays, parse } from "date-fns";

export interface IStorage {
  createWorkLog(workLog: InsertWorkLog): Promise<WorkLog>;
  getWorkLog(id: number): Promise<WorkLog | undefined>;
  updateWorkLog(id: number, updates: Partial<InsertWorkLog>): Promise<WorkLog | undefined>;
  deleteWorkLog(id: number): Promise<void>;
  getWorkLogsByRange(startDate: string, endDate: string): Promise<WorkLog[]>;
  getSetting(key: string): Promise<string | undefined>;
  updateSetting(key: string, value: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getSetting(key: string): Promise<string | undefined> {
    const [row] = await db.select().from(settings).where(eq(settings.key, key));
    return row?.value;
  }

  async updateSetting(key: string, value: string): Promise<void> {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }
  async createWorkLog(insertWorkLog: InsertWorkLog): Promise<WorkLog> {
    // Calculate hoursWorked
    const start = parse(insertWorkLog.startTime, 'HH:mm', new Date());
    const end = parse(insertWorkLog.endTime, 'HH:mm', new Date());
    let durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    // Handle overnight shifts? Requirement says valid end > start, so maybe not needed, but good to handle.
    // However, the prompt says "Validar que end_time sea mayor a start_time" so negative shouldn't happen.
    if (durationHours < 0) durationHours = 0; // Fallback

    const [workLog] = await db
      .insert(workLogs)
      .values({ 
        ...insertWorkLog, 
        hoursWorked: durationHours.toFixed(2) 
      })
      .returning();
    return workLog;
  }

  async getWorkLog(id: number): Promise<WorkLog | undefined> {
    const [workLog] = await db.select().from(workLogs).where(eq(workLogs.id, id));
    return workLog;
  }

  async updateWorkLog(id: number, updates: Partial<InsertWorkLog>): Promise<WorkLog | undefined> {
    const existing = await this.getWorkLog(id);
    if (!existing) return undefined;

    const startTime = updates.startTime || existing.startTime;
    const endTime = updates.endTime || existing.endTime;

    const start = parse(startTime, 'HH:mm', new Date());
    const end = parse(endTime, 'HH:mm', new Date());
    let durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (durationHours < 0) durationHours = 0;

    const [updatedWorkLog] = await db
      .update(workLogs)
      .set({ 
        ...updates, 
        hoursWorked: durationHours.toFixed(2),
        updatedAt: new Date() 
      })
      .where(eq(workLogs.id, id))
      .returning();
    return updatedWorkLog;
  }

  async deleteWorkLog(id: number): Promise<void> {
    await db.delete(workLogs).where(eq(workLogs.id, id));
  }

  async getWorkLogsByRange(startDate: string, endDate: string): Promise<WorkLog[]> {
    return await db
      .select()
      .from(workLogs)
      .where(
        and(
          gte(workLogs.date, startDate),
          lte(workLogs.date, endDate)
        )
      )
      .orderBy(asc(workLogs.date), asc(workLogs.startTime));
  }
}

export const storage = new DatabaseStorage();
