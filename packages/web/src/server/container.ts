import { cache } from "react";
import { TOURNAMENT_ID } from "./infrastructure/dynamodb-client";
import { DynamoTeamRepository } from "./infrastructure/repositories/team-repository";
import { DynamoMatchRepository } from "./infrastructure/repositories/match-repository";
import { DynamoBracketRepository } from "./infrastructure/repositories/bracket-repository";
import { DynamoTournamentRepository } from "./infrastructure/repositories/tournament-repository";
import { DynamoGroupRepository } from "./infrastructure/repositories/group-repository";
import { createGetTeams } from "./usecase/team/get-teams";
import { createGetMatches, createGetMatch } from "./usecase/match/get-matches";
import { createSubmitScore } from "./usecase/match/submit-score";
import { createChangeMatchStatus } from "./usecase/match/change-match-status";
import { createGetStandings } from "./usecase/standings/get-standings";
import { createGetTournamentData } from "./usecase/tournament/get-tournament-data";
import { createUpdateTournament } from "./usecase/tournament/update-tournament";
import { createVerifyPassword } from "./usecase/auth/verify-password";
import { createSaveGroup } from "./usecase/group/save-group";
import { createDeleteGroup } from "./usecase/group/delete-group";
import { createSaveTeam } from "./usecase/team/save-team";
import { createDeleteTeam } from "./usecase/team/delete-team";
import { createSaveMatch } from "./usecase/match/save-match";
import { createDeleteMatch } from "./usecase/match/delete-match";

// --- Repositories ---
const teamRepo = new DynamoTeamRepository();
const matchRepo = new DynamoMatchRepository();
const bracketRepo = new DynamoBracketRepository();
const tournamentRepo = new DynamoTournamentRepository();
const groupRepo = new DynamoGroupRepository();

// --- Read (cache でリクエスト単位メモ化) ---
export const getTeams = cache(createGetTeams(teamRepo, TOURNAMENT_ID));
export const getGroups = cache(() => groupRepo.findAll(TOURNAMENT_ID));
export const getMatches = cache(createGetMatches(matchRepo, TOURNAMENT_ID));
export const getMatch = createGetMatch(matchRepo); // 引数ありなので cache 不要
export const getStandings = cache(createGetStandings(matchRepo, teamRepo, groupRepo, TOURNAMENT_ID));
export const getTournamentData = cache(createGetTournamentData(bracketRepo, matchRepo, teamRepo, TOURNAMENT_ID));
export const getTournament = cache(() => tournamentRepo.findById(TOURNAMENT_ID));

// --- Write ---
export const submitScore = createSubmitScore(matchRepo);
export const changeMatchStatus = createChangeMatchStatus(matchRepo);
export const verifyPassword = createVerifyPassword(tournamentRepo, TOURNAMENT_ID);
export const updateTournament = createUpdateTournament(tournamentRepo, TOURNAMENT_ID);
export const saveGroup = createSaveGroup(groupRepo);
export const deleteGroup = createDeleteGroup(groupRepo);
export const saveTeam = createSaveTeam(teamRepo);
export const deleteTeam = createDeleteTeam(teamRepo);
export const saveMatch = createSaveMatch(matchRepo);
export const deleteMatch = createDeleteMatch(matchRepo);
export { TOURNAMENT_ID };
