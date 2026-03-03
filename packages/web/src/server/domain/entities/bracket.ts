import { z } from "zod";

export const seedSchema = z.object({
  groupId: z.string().min(1),
  rank: z.number().int().min(1),
});

export const bracketSchema = z.object({
  id: z.string().min(1),
  tournamentId: z.string().min(1),
  round: z.number().int().min(1),
  slot: z.number().int().min(0),
  matchId: z.string().min(1),
  homeSeed: seedSchema.nullable(),
  awaySeed: seedSchema.nullable(),
});

export type Seed = z.infer<typeof seedSchema>;
export type TournamentBracket = z.infer<typeof bracketSchema>;

export interface BracketRepository {
  findAll(tournamentId: string): Promise<TournamentBracket[]>;
  save(bracket: TournamentBracket): Promise<void>;
}
