export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import * as container from "@/server/container";
import { BracketGenerator } from "@/features/admin/ui/bracket-generator";
import { BracketManager } from "@/features/admin/ui/bracket-manager";
import { FormSkeleton, CardSkeleton } from "@/components/shared/section-skeleton";

type PageProps = { searchParams: Promise<{ id?: string }> };

async function GeneratorSection({ eventId }: { eventId: string }) {
  const [brackets, courts] = await Promise.all([
    container.getBrackets(eventId),
    container.getCourts(eventId),
  ]);
  return (
    <BracketGenerator
      existingBrackets={brackets}
      courts={courts}
      eventId={eventId}
    />
  );
}

async function ManagerSection({ eventId }: { eventId: string }) {
  const [brackets, matches, groups, teams, courts] = await Promise.all([
    container.getBrackets(eventId),
    container.getMatches(eventId),
    container.getGroups(eventId),
    container.getTeams(eventId),
    container.getCourts(eventId),
  ]);
  return (
    <BracketManager
      brackets={brackets}
      matches={matches}
      groups={groups}
      teams={teams}
      courts={courts}
      eventId={eventId}
    />
  );
}

export default async function BracketsPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const eventId = id || "default";
  const backHref = id ? `/more?id=${id}` : "/more";

  return (
    <div className="space-y-4">
      <Link href={backHref} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" />
        管理メニュー
      </Link>
      <h1 className="text-xl font-bold">トーナメント管理</h1>
      <Suspense fallback={<FormSkeleton />}>
        <GeneratorSection eventId={eventId} />
      </Suspense>
      <Suspense fallback={<CardSkeleton count={4} />}>
        <ManagerSection eventId={eventId} />
      </Suspense>
    </div>
  );
}
