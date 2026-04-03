"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import * as container from "@/server/container";
import { teamRefSchema } from "@/server/domain/entities/bracket";
import { type ActionState, ts, str, json } from "./helpers";

const saveBracketPayload = z.object({
  id: z.string().min(1).optional(),
  bracketName: z.string().min(1),
  round: z.number().int().min(1),
  slot: z.number().int().min(0),
  matchLabel: z.string().optional(),
  homeRef: teamRefSchema.nullish().transform((v) => v ?? null),
  awayRef: teamRefSchema.nullish().transform((v) => v ?? null),
  matchId: z.string().optional(),
  scheduledTime: z.string().optional(),
  durationMinutes: z.number().optional(),
  court: z.string().optional(),
});

const generateBracketsPayload = z.object({
  bracketName: z.string().min(1),
  teamCount: z.number().int().min(2),
  defaultScheduledTime: z.string(),
  defaultDurationMinutes: z.number().int().min(1),
  defaultCourts: z.array(z.string()),
});

const deleteBracketInput = z.object({
  id: z.string().min(1),
  matchId: z.string().min(1),
});

const deleteAllBracketsInput = z.array(z.object({
  id: z.string().min(1),
  matchId: z.string().min(1),
}));

export async function saveBracketFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const eventId = z.string().min(1).parse(str(formData, "eventId"));
    const payload = saveBracketPayload.parse(json(formData, "payload"));
    await container.saveBracket({ ...payload, eventId });
    revalidatePath("/admin/brackets");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: String(e), timestamp: ts() };
  }
}

export async function deleteBracketFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { id, matchId } = deleteBracketInput.parse({
      id: str(formData, "id"),
      matchId: str(formData, "matchId"),
    });
    await container.deleteBracket(id, matchId);
    revalidatePath("/admin/brackets");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: String(e), timestamp: ts() };
  }
}

export async function deleteAllBracketsFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const brackets = deleteAllBracketsInput.parse(json(formData, "payload"));
    await Promise.all(brackets.map((b) => container.deleteBracket(b.id, b.matchId)));
    revalidatePath("/admin/brackets");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: String(e), timestamp: ts() };
  }
}

export async function addBracketSlotFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const eventId = z.string().min(1).parse(str(formData, "eventId"));
    const payload = saveBracketPayload.parse(json(formData, "payload"));
    await container.saveBracket({ ...payload, eventId });
    revalidatePath("/admin/brackets");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: String(e), timestamp: ts() };
  }
}

export async function generateBracketsFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const eventId = z.string().min(1).parse(str(formData, "eventId"));
    const payload = generateBracketsPayload.parse(json(formData, "payload"));
    await container.generateBrackets({ ...payload, eventId });
    revalidatePath("/admin/brackets");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: String(e), timestamp: ts() };
  }
}

export async function deleteBracketAction(formData: FormData) {
  const { id, matchId } = deleteBracketInput.parse({
    id: str(formData, "id"),
    matchId: str(formData, "matchId"),
  });
  await container.deleteBracket(id, matchId);
  revalidatePath("/admin/brackets");
}

export async function deleteAllBracketsAction(formData: FormData) {
  const brackets = deleteAllBracketsInput.parse(json(formData, "payload"));
  await Promise.all(brackets.map((b) => container.deleteBracket(b.id, b.matchId)));
  revalidatePath("/admin/brackets");
}

export async function addBracketSlotAction(formData: FormData) {
  const eventId = z.string().min(1).parse(str(formData, "eventId"));
  const payload = saveBracketPayload.parse(json(formData, "payload"));
  await container.saveBracket({ ...payload, eventId });
  revalidatePath("/admin/brackets");
}
