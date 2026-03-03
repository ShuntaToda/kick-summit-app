import { z } from "zod";
import type { TournamentRepository } from "../../domain/entities/tournament";

const passwordInputSchema = z.string().min(1);

export const createVerifyPassword =
  (tournamentRepo: TournamentRepository, tournamentId: string) =>
  async (password: string): Promise<boolean> => {
    const validated = passwordInputSchema.parse(password);
    const tournament = await tournamentRepo.findById(tournamentId);
    if (!tournament) return true;
    return tournament.passwordHash === validated;
  };
