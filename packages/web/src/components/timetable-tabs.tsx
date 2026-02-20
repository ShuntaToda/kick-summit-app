"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  leagueContent: React.ReactNode;
  tournamentContent: React.ReactNode;
}

export function TimetableTabs({ leagueContent, tournamentContent }: Props) {
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
      <TabsContent value="league" className="mt-3 space-y-2">
        {leagueContent}
      </TabsContent>
      <TabsContent value="tournament" className="mt-3 space-y-2">
        {tournamentContent}
      </TabsContent>
    </Tabs>
  );
}
