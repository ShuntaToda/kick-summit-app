"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import * as container from "@/server/container";
import { type ActionState, ts, str, json, toErrorMessage } from "./helpers";

const GROUP_RANK_PREFIX = "group-rank:";

const saveCustomLeagueInput = z.object({
  id: z.string().min(1).optional(),
  eventId: z.string().min(1),
  name: z.string().min(1),
});

const deleteIdInput = z.object({
  id: z.string().min(1),
});

export async function saveCustomLeagueFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const input = saveCustomLeagueInput.parse({
      id: str(formData, "id") || undefined,
      eventId: str(formData, "eventId"),
      name: str(formData, "name"),
    });
    await container.saveCustomLeague(input);
    revalidatePath("/admin/custom-league");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: toErrorMessage(e), timestamp: ts() };
  }
}

// 同率発生時に管理者が手動で順位を確定するアクション
// overrides: { refLabel: string; teamId: string }[] の配列
export async function resolveGroupRankOverrideAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const eventId = z.string().min(1).parse(str(formData, "eventId"));
    const overrides = z.array(z.object({
      refLabel: z.string().min(1),
      teamId: z.string().min(1),
    })).parse(json(formData, "overrides"));

    const allMatches = await container.getMatches(eventId);
    const customLeagueMatches = allMatches.filter((m) => m.type === "custom-league");

    for (const { refLabel, teamId } of overrides) {
      for (const m of customLeagueMatches) {
        let changed = false;
        let teamAId = m.teamAId;
        let teamBId = m.teamBId;

        if (m.teamARefLabel === refLabel) {
          teamAId = teamId; changed = true;
        }
        if (m.teamBRefLabel === refLabel) {
          teamBId = teamId; changed = true;
        }
        if (changed) {
          await container.saveMatch({ ...m, teamAId, teamBId });
        }
      }
    }

    revalidatePath("/admin/custom-league");
    revalidatePath("/", "layout");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: toErrorMessage(e), timestamp: ts() };
  }
}

export async function deleteCustomLeagueFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { id } = deleteIdInput.parse({ id: str(formData, "id") });
    await container.deleteCustomLeague(id);
    revalidatePath("/admin/custom-league");
    return { success: true, timestamp: ts() };
  } catch (e) {
    return { success: false, error: toErrorMessage(e), timestamp: ts() };
  }
}
