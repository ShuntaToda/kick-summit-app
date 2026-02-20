import { z } from "zod";

export const tournamentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  date: z.string().min(1),
  passwordHash: z.string(),
});

export type Tournament = z.infer<typeof tournamentSchema>;

export interface TournamentRepository {
  findById(id: string): Promise<Tournament | null>;
  save(tournament: Tournament): Promise<void>;
}
