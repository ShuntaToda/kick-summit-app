import { z } from "zod";

export const customFieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "number"]),
  required: z.boolean().default(false),
});

export type CustomField = z.infer<typeof customFieldSchema>;

// 後方互換のためエイリアスを残す
export const eventCustomFieldSchema = customFieldSchema;
export type EventCustomField = CustomField;

export const eventSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  date: z.string().min(1),
  passwordHash: z.string(),
  description: z.string().default(""),
  customFields: z.array(customFieldSchema).default([]),
  eventFields: z.array(customFieldSchema).default([]),
  eventValues: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
});

export type Event = z.infer<typeof eventSchema>;

export interface EventRepository {
  findById(id: string): Promise<Event | null>;
  save(event: Event): Promise<void>;
}
