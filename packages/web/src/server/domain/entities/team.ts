import { z } from "zod";

export const teamSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  groupId: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1),
  customValues: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
});

export type Team = z.infer<typeof teamSchema>;

export interface TeamRepository {
  findAll(eventId: string): Promise<Team[]>;
  findByGroupId(groupId: string): Promise<Team[]>;
  findById(id: string): Promise<Team | null>;
  save(team: Team): Promise<void>;
  delete(id: string): Promise<void>;
}
