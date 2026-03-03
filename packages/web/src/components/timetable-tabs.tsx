"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

type GroupInfo = {
  id: string;
  name: string;
};

interface Props {
  groups: GroupInfo[];
  leagueContentByGroup: Record<string, React.ReactNode>;
  leagueContentAll: React.ReactNode;
  tournamentContent: React.ReactNode;
}

export function TimetableTabs({
  groups,
  leagueContentByGroup,
  leagueContentAll,
  tournamentContent,
}: Props) {
  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  return (
    <Tabs defaultValue="league">
      <TabsList className="w-full">
        <TabsTrigger value="league" className="flex-1">
          予選
        </TabsTrigger>
        <TabsTrigger value="tournament" className="flex-1">
          決勝
        </TabsTrigger>
      </TabsList>
      <TabsContent value="league" className="mt-3 space-y-3">
        {groups.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            <Button
              size="sm"
              variant={groupFilter === null ? "default" : "outline"}
              onClick={() => setGroupFilter(null)}
            >
              すべて
            </Button>
            {groups.map((g) => (
              <Button
                key={g.id}
                size="sm"
                variant={groupFilter === g.id ? "default" : "outline"}
                onClick={() => setGroupFilter(g.id)}
              >
                {g.name}
              </Button>
            ))}
          </div>
        )}
        <div className="space-y-2">
          {groupFilter === null
            ? leagueContentAll
            : leagueContentByGroup[groupFilter]}
        </div>
      </TabsContent>
      <TabsContent value="tournament" className="mt-3 space-y-2">
        {tournamentContent}
      </TabsContent>
    </Tabs>
  );
}
