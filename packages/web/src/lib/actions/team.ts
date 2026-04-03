"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import * as container from "@/server/container";
import { type ActionState, ts, str, json } from "./helpers";

const saveTeamPayload = z.object({
  id: z.string().min(1).optional(),
  groupId: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1),
  customValues: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
});

const deleteIdInput = z.object({
  id: z.string().min(1),
});

export async function saveTeamFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const eventId = z.string().min(1).parse(str(formData, "eventId"));
    const payload = saveTeamPayload.parse(json(formData, "payload"));
    await container.saveTeam({ ...payload, eventId });
    revalidatePath("/admin/teams");
    revalidatePath("/team-settings");
    revalidatePath("/");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: String(e), timestamp: ts() };
  }
}

export async function deleteTeamFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { id } = deleteIdInput.parse({ id: str(formData, "id") });
    await container.deleteTeam(id);
    revalidatePath("/admin/teams");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: String(e), timestamp: ts() };
  }
}

export async function deleteTeamAction(formData: FormData) {
  const { id } = deleteIdInput.parse({ id: str(formData, "id") });
  await container.deleteTeam(id);
  revalidatePath("/admin/teams");
}

export async function fetchTeams(eventId: string = container.DEFAULT_EVENT_ID) {
  return container.getTeams(eventId);
}
