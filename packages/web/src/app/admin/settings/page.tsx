export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import * as container from "@/server/container";
import { TournamentSettingsForm } from "@/components/tournament-settings-form";
import { FormSkeleton } from "@/components/section-skeleton";

type PageProps = { searchParams: Promise<{ id?: string }> };

async function SettingsData({ eventId }: { eventId: string }) {
  const event = await container.getEvent(eventId);

  if (!event) {
    return (
      <p className="text-muted-foreground">大会データが見つかりません</p>
    );
  }

  return <TournamentSettingsForm event={event} eventId={eventId} />;
}

export default async function SettingsPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const eventId = id || "default";
  const backHref = id ? `/more?id=${id}` : "/more";

  return (
    <div className="space-y-4">
      <Link href={backHref} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="mr-1 h-4 w-4" />
        管理メニュー
      </Link>
      <h1 className="text-xl font-bold">大会設定</h1>
      <Suspense fallback={<FormSkeleton />}>
        <SettingsData eventId={eventId} />
      </Suspense>
    </div>
  );
}
