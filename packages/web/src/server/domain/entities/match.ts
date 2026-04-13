import { z } from "zod";

export const matchStatusSchema = z.enum(["scheduled", "ongoing", "finished"]);
export const matchTypeSchema = z.enum(["league", "tournament", "custom-league"]);

export type MatchStatus = z.infer<typeof matchStatusSchema>;
export type MatchType = z.infer<typeof matchTypeSchema>;

export const matchSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  type: matchTypeSchema,
  groupId: z.string().nullish().transform((v) => v ?? null),
  teamAId: z.string().nullish().transform((v) => v ?? null),
  teamBId: z.string().nullish().transform((v) => v ?? null),
  scoreA: z.number().int().min(0).nullish().transform((v) => v ?? null),
  scoreB: z.number().int().min(0).nullish().transform((v) => v ?? null),
  halfScoreA: z.number().int().min(0).nullish().transform((v) => v ?? null),
  halfScoreB: z.number().int().min(0).nullish().transform((v) => v ?? null),
  scheduledTime: z.string().default(""),
  durationMinutes: z.number().int().min(1).default(10),
  court: z.string().min(1),
  status: matchStatusSchema,
  refereeTeamId: z.string().nullish().transform((v) => v ?? null),
  customLeagueId: z.string().nullish().transform((v) => v ?? null),
  teamARefLabel: z.string().nullish().transform((v) => v ?? null),
  teamBRefLabel: z.string().nullish().transform((v) => v ?? null),
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
  findAll(eventId: string): Promise<Match[]>;
  findByGroupId(groupId: string): Promise<Match[]>;
  findByCustomLeagueId(customLeagueId: string): Promise<Match[]>;
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
