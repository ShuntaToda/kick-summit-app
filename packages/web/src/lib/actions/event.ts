"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import * as container from "@/server/container";
import { customFieldSchema } from "@/server/domain/entities/event";
import { type ActionState, ts, str, json } from "./helpers";

const updateEventInput = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1),
  date: z.string().min(1),
  description: z.string().default(""),
  customFields: z.array(customFieldSchema).default([]),
});

export async function updateEventFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { eventId, ...input } = updateEventInput.parse({
      eventId: str(formData, "eventId"),
      name: str(formData, "name"),
      date: str(formData, "date"),
      description: str(formData, "description"),
      customFields: json(formData, "customFields"),
    });
    await container.updateEvent(eventId)(input);
    revalidatePath("/admin/settings");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: String(e), timestamp: ts() };
  }
}
