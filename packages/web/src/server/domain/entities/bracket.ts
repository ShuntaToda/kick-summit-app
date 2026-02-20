import { z } from "zod";

export const bracketSchema = z.object({
  id: z.string().min(1),
  round: z.number().int().min(1),
  slot: z.number().int().min(0),
  matchId: z.string().min(1),
});

export type TournamentBracket = z.infer<typeof bracketSchema>;

export interface BracketRepository {
  findAll(): Promise<TournamentBracket[]>;
  save(bracket: TournamentBracket): Promise<void>;
}
