
import { z } from 'zod';
import { insertWorkLogSchema, workLogs } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// Summary schema for response validation
const daySummarySchema = z.object({
  date: z.string(),
  dayName: z.string(),
  totalHours: z.number(),
});

const weeklySummarySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  days: z.array(daySummarySchema),
  totalWeeklyHours: z.number(),
  totalPay: z.number(),
  // Quincenal data
  quincenaLabel: z.string().optional(),
  quincenaHours: z.number().optional(),
  quincenaPay: z.number().optional(),
});

export const api = {
  workLogs: {
    create: {
      method: 'POST' as const,
      path: '/api/work-logs',
      input: insertWorkLogSchema,
      responses: {
        201: z.custom<typeof workLogs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    listWeek: {
      method: 'GET' as const,
      path: '/api/work-logs/week',
      input: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional(), // Date within the week
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof workLogs.$inferSelect>()),
      },
    },
    getSummary: {
      method: 'GET' as const,
      path: '/api/work-logs/week/summary',
      input: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional(),
      }).optional(),
      responses: {
        200: weeklySummarySchema,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/work-logs/:id',
      input: insertWorkLogSchema.partial(),
      responses: {
        200: z.custom<typeof workLogs.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/work-logs/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  settings: {
    get: {
      method: 'GET' as const,
      path: '/api/settings/:key',
      responses: {
        200: z.object({ key: z.string(), value: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/settings/:key',
      input: z.object({ value: z.string() }),
      responses: {
        200: z.object({ key: z.string(), value: z.string() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type WorkLogInput = z.infer<typeof api.workLogs.create.input>;
export type WorkLogUpdateInput = z.infer<typeof api.workLogs.update.input>;
export type WeeklySummary = z.infer<typeof weeklySummarySchema>;
