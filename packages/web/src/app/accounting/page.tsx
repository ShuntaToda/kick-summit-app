export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import * as container from "@/server/container";
import { AccountingContent } from "@/components/accounting-content";
import { CardSkeleton } from "@/components/section-skeleton";

type PageProps = { searchParams: Promise<{ id?: string }> };

async function AccountingData({ eventId }: { eventId: string }) {
  const [teams, event] = await Promise.all([
    container.getTeams(eventId),
    container.getEvent(eventId),
  ]);
  return (
    <AccountingContent
      teams={teams}
      customFields={event?.customFields ?? []}
      eventFields={event?.eventFields ?? []}
      eventValues={event?.eventValues ?? {}}
    />
  );
}

export default async function AccountingPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const eventId = id || "default";
  const backHref = id ? `/more?id=${id}` : "/more";

  return (
    <div className="space-y-4">
      <Link href={backHref} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" />
        その他
      </Link>
      <h1 className="text-xl font-bold">会計</h1>
      <Suspense fallback={<CardSkeleton count={3} />}>
        <AccountingData eventId={eventId} />
      </Suspense>
    </div>
  );
}
