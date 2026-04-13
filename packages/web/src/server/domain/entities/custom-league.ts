import { z } from "zod";

export const customLeagueSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  name: z.string().min(1),
});

export type CustomLeague = z.infer<typeof customLeagueSchema>;

export interface CustomLeagueRepository {
  findAll(eventId: string): Promise<CustomLeague[]>;
  findById(id: string): Promise<CustomLeague | null>;
  save(customLeague: CustomLeague): Promise<void>;
  delete(id: string): Promise<void>;
}
