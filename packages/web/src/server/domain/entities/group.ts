import { z } from "zod";

export const groupSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  name: z.string().min(1),
});

export type Group = z.infer<typeof groupSchema>;

export interface GroupRepository {
  findAll(eventId: string): Promise<Group[]>;
  findById(id: string): Promise<Group | null>;
  save(group: Group): Promise<void>;
  delete(id: string): Promise<void>;
}
