"use server";

import { getTeams } from "@/server/application/get-teams";
import { getMatches, getMatch } from "@/server/application/get-matches";
import { getStandings } from "@/server/application/get-standings";
import { getTournamentData } from "@/server/application/get-tournament-data";
import { submitScore as submitScoreUseCase } from "@/server/application/submit-score";
import { changeMatchStatus as changeMatchStatusUseCase } from "@/server/application/change-match-status";
import { verifyPassword as verifyPasswordUseCase } from "@/server/application/verify-password";

// --- 取得系 ---

export async function fetchTeams() {
  return getTeams();
}

export async function fetchMatches() {
  return getMatches();
}

export async function fetchMatch(matchId: string) {
  return getMatch(matchId);
}

export async function fetchStandings(group?: string) {
  return getStandings(group);
}

export async function fetchTournamentData() {
  return getTournamentData();
}

// --- 更新系 ---

export async function submitScore(
  matchId: string,
  scoreA: number,
  scoreB: number,
  halfScoreA: number | null,
  halfScoreB: number | null
) {
  await submitScoreUseCase(matchId, scoreA, scoreB, halfScoreA, halfScoreB);
}

export async function changeMatchStatus(
  matchId: string,
  status: "scheduled" | "ongoing" | "finished"
) {
  await changeMatchStatusUseCase(matchId, status);
}

// --- 認証 ---

export async function verifyPassword(password: string) {
  return verifyPasswordUseCase(password);
}
