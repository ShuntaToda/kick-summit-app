"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import * as container from "@/server/container";
import { customFieldSchema, contentSectionSchema } from "@/server/domain/entities/event";
import { type ActionState, ts, str, json, toErrorMessage } from "./helpers";

const updateEventInput = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1),
  date: z.string().min(1),
  description: z.string().default(""),
  customFields: z.array(customFieldSchema).default([]),
  eventFields: z.array(customFieldSchema).default([]),
  eventValues: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
  contentSections: z.array(contentSectionSchema).default([]),
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
      eventFields: json(formData, "eventFields"),
      eventValues: json(formData, "eventValues"),
      contentSections: json(formData, "contentSections"),
    });
    await container.updateEvent(eventId)(input);
    revalidatePath("/admin/settings");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: toErrorMessage(e), timestamp: ts() };
  }
}
