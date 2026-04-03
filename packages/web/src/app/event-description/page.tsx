export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import * as container from "@/server/container";
import { EventDescription } from "@/components/event-description";

type PageProps = { searchParams: Promise<{ id?: string }> };

async function DescriptionData({ eventId }: { eventId: string }) {
  const event = await container.getEvent(eventId);
  if (!event) {
    return (
      <p className="text-sm text-muted-foreground">大会データが見つかりません。</p>
    );
  }
  return (
    <>
      <h2 className="text-lg font-bold">{event.name}</h2>
      <p className="text-sm text-muted-foreground">{event.date}</p>
      {event.description ? (
        <EventDescription description={event.description} />
      ) : (
        <p className="text-sm text-muted-foreground">説明がありません。</p>
      )}
    </>
  );
}

export default async function EventDescriptionPage({ searchParams }: PageProps) {
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
        その他
      </Link>
      <h1 className="text-xl font-bold">大会説明</h1>
      <Suspense>
        <DescriptionData eventId={eventId} />
      </Suspense>
    </div>
  );
}
