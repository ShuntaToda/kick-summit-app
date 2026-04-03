"use server";

import * as container from "@/server/container";

export async function verifyPassword(eventId: string, password: string) {
  return container.verifyPassword(eventId)(password);
}
