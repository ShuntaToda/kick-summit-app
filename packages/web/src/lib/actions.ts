"use server";

import * as container from "@/server/container";

// --- 取得系 ---

export async function fetchTeams() {
  return container.getTeams();
}

// --- 更新系 ---

export async function submitScore(
  matchId: string,
  scoreA: number,
  scoreB: number,
  halfScoreA: number | null,
  halfScoreB: number | null,
) {
  await container.submitScore({
    matchId,
    scoreA,
    scoreB,
    halfScoreA,
    halfScoreB,
  });
}

export async function changeMatchStatus(
  matchId: string,
  status: "scheduled" | "ongoing" | "finished",
) {
  await container.changeMatchStatus({ matchId, status });
}

// --- 管理系 ---

export async function updateTournament(input: {
  name: string;
  date: string;
  description: string;
  courtFee: number;
  partyFeePerPerson: number;
}) {
  await container.updateTournament(input);
}

export async function saveGroup(input: {
  id?: string;
  name: string;
}) {
  await container.saveGroup({
    ...input,
    tournamentId: container.TOURNAMENT_ID,
  });
}

export async function deleteGroup(id: string) {
  await container.deleteGroup(id);
}

export async function saveTeam(input: {
  id?: string;
  groupId: string;
  name: string;
  color: string;
  partyCount: number;
  receiptName: string;
}) {
  await container.saveTeam({
    ...input,
    tournamentId: container.TOURNAMENT_ID,
  });
}

export async function deleteTeam(id: string) {
  await container.deleteTeam(id);
}

export async function saveMatch(input: {
  id?: string;
  type: "league" | "tournament";
  groupId: string | null;
  teamAId: string | null;
  teamBId: string | null;
  scheduledTime: string;
  durationMinutes: number;
  court: string;
  status: "scheduled" | "ongoing" | "finished";
  refereeTeamId?: string | null;
}) {
  await container.saveMatch({
    ...input,
    tournamentId: container.TOURNAMENT_ID,
  });
}

export async function deleteMatch(id: string) {
  await container.deleteMatch(id);
}

// --- 認証 ---

export async function verifyPassword(password: string) {
  return container.verifyPassword(password);
}
