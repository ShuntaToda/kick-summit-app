import { z } from "zod";

export const teamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  group: z.string().min(1),
  color: z.string().min(1),
});

export type Team = z.infer<typeof teamSchema>;

export interface TeamRepository {
  findAll(): Promise<Team[]>;
  findById(id: string): Promise<Team | null>;
  save(team: Team): Promise<void>;
}
