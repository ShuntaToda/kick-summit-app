"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import * as container from "@/server/container";
import { type ActionState, ts, str, strOrNull } from "./helpers";

const saveCourtInput = z.object({
  eventId: z.string().min(1),
  id: z.string().min(1).optional(),
  name: z.string().min(1),
});

const deleteIdInput = z.object({
  id: z.string().min(1),
});

export async function saveCourtFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { eventId, id, name } = saveCourtInput.parse({
      eventId: str(formData, "eventId"),
      id: strOrNull(formData, "id") ?? undefined,
      name: str(formData, "name"),
    });
    await container.saveCourt({ id, name, eventId });
    revalidatePath("/admin/settings");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: String(e), timestamp: ts() };
  }
}

export async function deleteCourtFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { id } = deleteIdInput.parse({ id: str(formData, "id") });
    await container.deleteCourt(id);
    revalidatePath("/admin/settings");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: String(e), timestamp: ts() };
  }
}

export async function deleteCourtAction(formData: FormData) {
  const { id } = deleteIdInput.parse({ id: str(formData, "id") });
  await container.deleteCourt(id);
  revalidatePath("/admin/settings");
}
