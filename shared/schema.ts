
import { pgTable, text, serial, decimal, date, time, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const workLogs = pgTable("work_logs", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  hoursWorked: decimal("hours_worked", { precision: 5, scale: 2 }).notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// === BASE SCHEMAS ===
// We omit hoursWorked because it's calculated on the server
export const insertWorkLogSchema = createInsertSchema(workLogs)
  .omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true,
    hoursWorked: true 
  })
  .extend({
    // Ensure date is a string YYYY-MM-DD
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    // Ensure times are HH:mm
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"),
    // hourlyRate can be string or number in JSON, coerce it
    hourlyRate: z.coerce.number().optional(),
  });

// === EXPLICIT API CONTRACT TYPES ===
export type WorkLog = typeof workLogs.$inferSelect;
export type InsertWorkLog = z.infer<typeof insertWorkLogSchema>;

// Request types
export type CreateWorkLogRequest = InsertWorkLog;
export type UpdateWorkLogRequest = Partial<InsertWorkLog>;

// Response types
export type WorkLogResponse = WorkLog;

// Summary types
export interface DaySummary {
  date: string;
  dayName: string; // Mon, Tue, etc.
  totalHours: number;
}

export interface WeeklySummaryResponse {
  startDate: string;
  endDate: string;
  days: DaySummary[];
  totalWeeklyHours: number;
  totalPay: number;
}
