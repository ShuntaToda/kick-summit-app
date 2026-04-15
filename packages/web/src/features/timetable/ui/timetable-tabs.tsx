"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type GroupInfo = {
  id: string;
  name: string;
};

type CustomLeagueInfo = {
  id: string;
  name: string;
  content: React.ReactNode;
};

interface Props {
  groups: GroupInfo[];
  leagueContentByGroup: Record<string, React.ReactNode>;
  leagueContentAll: React.ReactNode;
  tournamentContent: React.ReactNode;
  customLeagueContent?: CustomLeagueInfo[];
}

export function TimetableTabs({
  groups,
  leagueContentByGroup,
  leagueContentAll,
  tournamentContent,
  customLeagueContent = [],
}: Props) {
  return (
    <Tabs defaultValue="all">
      <TabsList className="w-full flex-wrap h-auto">
        <TabsTrigger value="all" className="flex-1">
          すべて
        </TabsTrigger>
        {groups.map((g) => (
          <TabsTrigger key={g.id} value={`group-${g.id}`} className="flex-1">
            {g.name}
          </TabsTrigger>
        ))}
        {customLeagueContent.map((cl) => (
          <TabsTrigger key={cl.id} value={`cl-${cl.id}`} className="flex-1">
            {cl.name}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="all" className="mt-3 space-y-2">
        {leagueContentAll}
      </TabsContent>
      {groups.map((g) => (
        <TabsContent key={g.id} value={`group-${g.id}`} className="mt-3 space-y-2">
          {leagueContentByGroup[g.id]}
        </TabsContent>
      ))}
      {customLeagueContent.map((cl) => (
        <TabsContent key={cl.id} value={`cl-${cl.id}`} className="mt-3 space-y-2">
          {cl.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
