import { z } from "zod";

export const teamRefSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("team"),
    teamId: z.string().min(1),
  }),
  z.object({
    type: z.literal("match-result"),
    matchId: z.string().min(1),
    result: z.enum(["winner", "loser"]),
  }),
  z.object({
    type: z.literal("group-rank"),
    groupId: z.string().min(1),
    rank: z.number().int().min(1),
  }),
]);

export const bracketSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  bracketName: z.string().min(1),
  round: z.number().int().min(1),
  slot: z.number().int().min(0),
  matchId: z.string().min(1),
  matchLabel: z.string().default(""),
  homeRef: teamRefSchema.nullish().transform((v) => v ?? null),
  awayRef: teamRefSchema.nullish().transform((v) => v ?? null),
});

export type TeamRef = z.infer<typeof teamRefSchema>;
export type Bracket = z.infer<typeof bracketSchema>;

export interface BracketRepository {
  findAll(eventId: string): Promise<Bracket[]>;
  save(bracket: Bracket): Promise<void>;
  delete(id: string): Promise<void>;
}
