import type { TournamentRepository } from "../../domain/entities/tournament";

type UpdateInput = {
  name: string;
  date: string;
  description: string;
  courtFee: number;
  partyFeePerPerson: number;
};

export const createUpdateTournament =
  (tournamentRepo: TournamentRepository, tournamentId: string) =>
  async (input: UpdateInput): Promise<void> => {
    const tournament = await tournamentRepo.findById(tournamentId);
    if (!tournament) throw new Error("Tournament not found");
    await tournamentRepo.save({ ...tournament, ...input });
  };
