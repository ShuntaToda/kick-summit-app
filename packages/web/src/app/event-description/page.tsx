export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import * as container from "@/server/container";
import { EventDescription } from "@/components/features/event/event-description";

type PageProps = { searchParams: Promise<{ id?: string; section?: string }> };

async function DescriptionData({ eventId, sectionId }: { eventId: string; sectionId?: string }) {
  const event = await container.getEvent(eventId);
  if (!event) {
    return (
      <p className="text-sm text-muted-foreground">大会データが見つかりません。</p>
    );
  }

  // 特定セクションのみ表示
  if (sectionId) {
    const section = event.contentSections?.find((s) => s.id === sectionId);
    if (!section) {
      return <p className="text-sm text-muted-foreground">セクションが見つかりません。</p>;
    }
    return (
      <EventDescription description={section.body} />
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
      {event.contentSections && event.contentSections.length > 0 && (
        <div className="space-y-6 mt-4">
          {event.contentSections.map((section) => (
            <div key={section.id} className="space-y-2">
              <h3 className="text-base font-semibold">{section.title}</h3>
              <EventDescription description={section.body} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default async function EventDescriptionPage({ searchParams }: PageProps) {
  const { id, section } = await searchParams;
  const eventId = id || "default";
  const backHref = id ? `/more?id=${id}` : "/more";

  // セクション表示時はそのセクション名をタイトルに使う
  let title = "大会説明";
  if (section) {
    const event = await container.getEvent(eventId);
    const found = event?.contentSections?.find((s) => s.id === section);
    if (found) title = found.title;
  }

  return (
    <div className="space-y-4">
      <Link
        href={backHref}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        その他
      </Link>
      <h1 className="text-xl font-bold">{title}</h1>
      <Suspense>
        <DescriptionData eventId={eventId} sectionId={section} />
      </Suspense>
    </div>
  );
}
