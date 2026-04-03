import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import * as container from "@/server/container";
import { AdminToggle } from "@/components/admin-toggle";
import { TeamSettingsLink } from "@/components/team-settings-link";
import { Card, CardContent } from "@/components/ui/card";

type PageProps = { searchParams: Promise<{ id?: string }> };

async function EventOverview({ eventId }: { eventId: string }) {
  const event = await container.getEvent(eventId);
  if (!event) return null;
  const idSuffix = eventId !== "default" ? `?id=${encodeURIComponent(eventId)}` : "";
  return (
    <>
      <Card>
        <CardContent className="space-y-1 pt-6">
          <h2 className="text-lg font-bold">{event.name}</h2>
          <p className="text-sm text-muted-foreground">{event.date}</p>
        </CardContent>
      </Card>
      {event.description && (
        <Link
          href={`/event-description${idSuffix}`}
          className="flex items-center justify-between rounded-md border px-4 py-3 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">大会説明</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}
    </>
  );
}

export default async function MorePage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const eventId = id || "default";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">その他</h1>
      <Suspense>
        <EventOverview eventId={eventId} />
      </Suspense>
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">チーム</h2>
        <TeamSettingsLink eventId={eventId} />
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">管理者</h2>
        <AdminToggle eventId={eventId} />
      </section>
    </div>
  );
}
