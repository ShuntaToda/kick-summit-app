"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import * as container from "@/server/container";
import { type ActionState, ts, str, strOrNull, toErrorMessage } from "./helpers";

const saveGroupInput = z.object({
  eventId: z.string().min(1),
  id: z.string().min(1).optional(),
  name: z.string().min(1),
});

const deleteIdInput = z.object({
  id: z.string().min(1),
});

export async function saveGroupFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { eventId, id, name } = saveGroupInput.parse({
      eventId: str(formData, "eventId"),
      id: strOrNull(formData, "id") ?? undefined,
      name: str(formData, "name"),
    });
    await container.saveGroup({ id, name, eventId });
    revalidatePath("/admin/groups");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: toErrorMessage(e), timestamp: ts() };
  }
}

export async function deleteGroupFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { id } = deleteIdInput.parse({ id: str(formData, "id") });
    await container.deleteGroup(id);
    revalidatePath("/admin/groups");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: toErrorMessage(e), timestamp: ts() };
  }
}

export async function deleteGroupAction(formData: FormData) {
  const { id } = deleteIdInput.parse({ id: str(formData, "id") });
  await container.deleteGroup(id);
  revalidatePath("/admin/groups");
}
