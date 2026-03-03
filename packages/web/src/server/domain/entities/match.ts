import { z } from "zod";

export const matchStatusSchema = z.enum(["scheduled", "ongoing", "finished"]);
export const matchTypeSchema = z.enum(["league", "tournament"]);

export type MatchStatus = z.infer<typeof matchStatusSchema>;
export type MatchType = z.infer<typeof matchTypeSchema>;

export const matchSchema = z.object({
  id: z.string().min(1),
  tournamentId: z.string().min(1),
  type: matchTypeSchema,
  groupId: z.string().nullable(),
  teamAId: z.string().nullable(),
  teamBId: z.string().nullable(),
  scoreA: z.number().int().min(0).nullable(),
  scoreB: z.number().int().min(0).nullable(),
  halfScoreA: z.number().int().min(0).nullable(),
  halfScoreB: z.number().int().min(0).nullable(),
  scheduledTime: z.string().default(""),
  durationMinutes: z.number().int().min(1).default(10),
  court: z.string().min(1),
  status: matchStatusSchema,
  refereeTeamId: z.string().nullable().default(null),
});

export type Match = z.infer<typeof matchSchema>;

export const submitScoreInputSchema = z.object({
  matchId: z.string().min(1),
  scoreA: z.number().int().min(0),
  scoreB: z.number().int().min(0),
  halfScoreA: z.number().int().min(0).nullable(),
  halfScoreB: z.number().int().min(0).nullable(),
});

export const changeStatusInputSchema = z.object({
  matchId: z.string().min(1),
  status: matchStatusSchema,
});

export interface MatchRepository {
  findAll(tournamentId: string): Promise<Match[]>;
  findByGroupId(groupId: string): Promise<Match[]>;
  findById(id: string): Promise<Match | null>;
  save(match: Match): Promise<void>;
  updateScore(
    matchId: string,
    scoreA: number,
    scoreB: number,
    halfScoreA: number | null,
    halfScoreB: number | null,
    status: MatchStatus,
  ): Promise<void>;
  updateStatus(matchId: string, status: MatchStatus): Promise<void>;
  delete(id: string): Promise<void>;
}
