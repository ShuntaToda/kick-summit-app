import { z } from "zod";

export const teamSchema = z.object({
  id: z.string().min(1),
  tournamentId: z.string().min(1),
  groupId: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1),
  partyCount: z.number().int().min(0),
  receiptName: z.string().default(""),
});

export type Team = z.infer<typeof teamSchema>;

export interface TeamRepository {
  findAll(tournamentId: string): Promise<Team[]>;
  findByGroupId(groupId: string): Promise<Team[]>;
  findById(id: string): Promise<Team | null>;
  save(team: Team): Promise<void>;
  delete(id: string): Promise<void>;
}
