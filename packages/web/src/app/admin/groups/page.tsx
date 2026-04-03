export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import * as container from "@/server/container";
import { GroupManager } from "@/components/group-manager";
import { CardSkeleton } from "@/components/section-skeleton";

type PageProps = { searchParams: Promise<{ id?: string }> };

async function GroupsData({ eventId }: { eventId: string }) {
  const groups = await container.getGroups(eventId);
  return <GroupManager groups={groups} eventId={eventId} />;
}

export default async function GroupsPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const eventId = id || "default";
  const backHref = id ? `/more?id=${id}` : "/more";

  return (
    <div className="space-y-4">
      <Link href={backHref} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" />
        管理メニュー
      </Link>
      <h1 className="text-xl font-bold">グループ管理</h1>
      <Suspense fallback={<CardSkeleton count={2} />}>
        <GroupsData eventId={eventId} />
      </Suspense>
    </div>
  );
}
