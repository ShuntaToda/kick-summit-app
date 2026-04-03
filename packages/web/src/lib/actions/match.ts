"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import * as container from "@/server/container";
import { matchStatusSchema, matchTypeSchema } from "@/server/domain/entities/match";
import { type ActionState, ts, str, json } from "./helpers";

const saveMatchPayload = z.object({
  id: z.string().min(1).optional(),
  type: matchTypeSchema,
  groupId: z.string().nullish().transform((v) => v ?? null),
  teamAId: z.string().nullish().transform((v) => v ?? null),
  teamBId: z.string().nullish().transform((v) => v ?? null),
  scheduledTime: z.string().default(""),
  durationMinutes: z.number().int().min(1).default(10),
  court: z.string().min(1),
  refereeTeamId: z.string().nullish().transform((v) => v ?? null),
});

const changeMatchStatusInput = z.object({
  matchId: z.string().min(1),
  status: matchStatusSchema,
});

const deleteIdInput = z.object({
  id: z.string().min(1),
});

export async function saveMatchFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const eventId = z.string().min(1).parse(str(formData, "eventId"));
    const payload = saveMatchPayload.parse(json(formData, "payload"));
    const existing = payload.id ? await container.getMatch(payload.id) : null;
    await container.saveMatch({ ...payload, eventId, status: existing?.status ?? "scheduled" });
    revalidatePath("/admin/matches");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: String(e), timestamp: ts() };
  }
}

export async function deleteMatchFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { id } = deleteIdInput.parse({ id: str(formData, "id") });
    await container.deleteMatch(id);
    revalidatePath("/admin/matches");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: String(e), timestamp: ts() };
  }
}

export async function changeMatchStatusFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { matchId, status } = changeMatchStatusInput.parse({
      matchId: str(formData, "matchId"),
      status: str(formData, "status"),
    });
    await container.changeMatchStatus({ matchId, status });
    if (status === "finished") {
      const eventId = str(formData, "eventId") || container.DEFAULT_EVENT_ID;
      await container.resolveMatchResults(eventId, matchId);
    }
    revalidatePath("/", "layout");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: String(e), timestamp: ts() };
  }
}

export async function changeMatchStatusAction(formData: FormData) {
  const { matchId, status } = changeMatchStatusInput.parse({
    matchId: str(formData, "matchId"),
    status: str(formData, "status"),
  });
  await container.changeMatchStatus({ matchId, status });
  if (status === "finished") {
    const eventId = str(formData, "eventId") || container.DEFAULT_EVENT_ID;
    await container.resolveMatchResults(eventId, matchId);
  }
  revalidatePath("/", "layout");
}

export async function deleteMatchAction(formData: FormData) {
  const { id } = deleteIdInput.parse({ id: str(formData, "id") });
  await container.deleteMatch(id);
  revalidatePath("/admin/matches");
}

export async function submitScore(
  matchId: string,
  scoreA: number,
  scoreB: number,
  halfScoreA: number | null,
  halfScoreB: number | null,
  eventId: string = container.DEFAULT_EVENT_ID,
) {
  await container.submitScore({
    matchId,
    scoreA,
    scoreB,
    halfScoreA,
    halfScoreB,
  });
  await container.resolveMatchResults(eventId, matchId);
}

export async function saveScheduleFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const eventId = z.string().min(1).parse(str(formData, "eventId"));
    const deleteIds = z.array(z.string()).parse(json(formData, "deleteIds"));
    const matches = z.array(saveMatchPayload).parse(json(formData, "matches"));
    await Promise.all(deleteIds.map((id) => container.deleteMatch(id)));
    await Promise.all(
      matches.map(async (m) => {
        const existing = m.id ? await container.getMatch(m.id) : null;
        return container.saveMatch({ ...m, eventId, status: existing?.status ?? "scheduled" });
      }),
    );
    revalidatePath("/admin/matches");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: String(e), timestamp: ts() };
  }
}
