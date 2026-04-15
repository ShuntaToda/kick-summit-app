export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import * as container from "@/server/container";
import { CourtManager } from "@/features/admin/ui/court-manager";
import { CardSkeleton } from "@/components/shared/section-skeleton";

type PageProps = { searchParams: Promise<{ id?: string }> };

async function CourtsData({ eventId }: { eventId: string }) {
  const courts = await container.getCourts(eventId);
  return <CourtManager courts={courts} eventId={eventId} />;
}

export default async function CourtsPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const eventId = id || "default";
  const backHref = id ? `/more?id=${id}` : "/more";

  return (
    <div className="space-y-4">
      <Link
        href={backHref}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        管理メニュー
      </Link>
      <h1 className="text-xl font-bold">コート管理</h1>
      <Suspense fallback={<CardSkeleton count={1} />}>
        <CourtsData eventId={eventId} />
      </Suspense>
    </div>
  );
}
