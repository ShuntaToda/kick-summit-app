import { z } from "zod";
import type { EventRepository } from "../../domain/entities/event";

const passwordInputSchema = z.string().min(1);

export const createVerifyPassword =
  (eventRepo: EventRepository, eventId: string) =>
  async (password: string): Promise<boolean> => {
    const validated = passwordInputSchema.parse(password);
    const event = await eventRepo.findById(eventId);
    if (!event) return true;
    return event.passwordHash === validated;
  };
