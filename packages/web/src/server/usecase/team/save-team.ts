import type { TeamRepository } from "../../domain/entities/team";

type SaveTeamInput = {
  id?: string;
  tournamentId: string;
  groupId: string;
  name: string;
  color: string;
  partyCount: number;
  receiptName: string;
};

export const createSaveTeam =
  (teamRepo: TeamRepository) =>
  async (input: SaveTeamInput): Promise<void> => {
    const id = input.id ?? crypto.randomUUID();
    await teamRepo.save({
      id,
      tournamentId: input.tournamentId,
      groupId: input.groupId,
      name: input.name,
      color: input.color,
      partyCount: input.partyCount,
      receiptName: input.receiptName,
    });
  };
