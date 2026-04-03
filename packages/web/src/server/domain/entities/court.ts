import { z } from "zod";

export const courtSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  name: z.string().min(1),
});

export type Court = z.infer<typeof courtSchema>;

export interface CourtRepository {
  findAll(eventId: string): Promise<Court[]>;
  findById(id: string): Promise<Court | null>;
  save(court: Court): Promise<void>;
  delete(id: string): Promise<void>;
}
