export const dynamic = "force-dynamic";

import { Suspense } from "react";
import * as container from "@/server/container";
import { Refresher } from "@/components/shared/refresher";
import { TimetableTabs } from "@/features/timetable/ui/timetable-tabs";
import { TimetableMatchList } from "@/features/timetable/ui/timetable-match-list";
import { CardSkeleton } from "@/components/shared/section-skeleton";

type PageProps = { searchParams: Promise<{ id?: string }> };

async function TimetableData({ eventId }: { eventId: string }) {
  const [teams, matches, groupsRaw, customLeagues] = await Promise.all([
    container.getTeams(eventId),
    container.getMatches(eventId),
    container.getGroups(eventId),
    container.getCustomLeagues(eventId),
  ]);

  const groups = [...groupsRaw].sort((a, b) => a.name.localeCompare(b.name));

  const teamMap: Record<string, { name: string; color: string; groupId: string }> = {};
  for (const t of teams) {
    teamMap[t.id] = { name: t.name, color: t.color, groupId: t.groupId };
  }

  const groupMap: Record<string, string> = {};
  for (const g of groups) {
    groupMap[g.id] = g.name;
  }

  const sortByTime = (a: { scheduledTime: string }, b: { scheduledTime: string }) =>
    a.scheduledTime.localeCompare(b.scheduledTime);

  const leagueMatches = matches
    .filter((m) => m.type === "league")
    .sort(sortByTime);

  const tournamentMatches = matches
    .filter((m) => m.type === "tournament")
    .sort(sortByTime);

  const leagueContentByGroup: Record<string, React.ReactNode> = {};
  for (const group of groups) {
    const groupMatches = leagueMatches.filter((m) => m.groupId === group.id);
    leagueContentByGroup[group.id] = (
      <TimetableMatchList matches={groupMatches} teamMap={teamMap} groupMap={groupMap} eventId={eventId} />
    );
  }

  const customLeagueContent: { id: string; name: string; content: React.ReactNode }[] = customLeagues.map((league) => ({
    id: league.id,
    name: league.name,
    content: (
      <TimetableMatchList
        matches={matches.filter((m) => m.type === "custom-league" && m.customLeagueId === league.id).sort(sortByTime)}
        teamMap={teamMap}
        groupMap={groupMap}
        eventId={eventId}
      />
    ),
  }));

  const allMatches = matches
    .filter((m) => m.type === "league" || m.type === "custom-league")
    .sort(sortByTime);

  return (
    <TimetableTabs
      groups={groups.map((g) => ({ id: g.id, name: g.name }))}
      leagueContentAll={
        <TimetableMatchList matches={allMatches} teamMap={teamMap} groupMap={groupMap} eventId={eventId} />
      }
      leagueContentByGroup={leagueContentByGroup}
      tournamentContent={
        <TimetableMatchList matches={tournamentMatches} teamMap={teamMap} groupMap={groupMap} eventId={eventId} />
      }
      customLeagueContent={customLeagueContent}
    />
  );
}

export default async function TimetablePage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const eventId = id || "default";

  return (
    <div className="space-y-4">
      <Refresher />
      <h1 className="text-xl font-bold">タイムテーブル</h1>
      <Suspense fallback={<CardSkeleton count={6} />}>
        <TimetableData eventId={eventId} />
      </Suspense>
    </div>
  );
}
