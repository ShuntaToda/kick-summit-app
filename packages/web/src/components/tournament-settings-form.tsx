"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { updateTournament } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { Tournament } from "@/server/domain/entities/tournament";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Props = {
  tournament: Tournament;
};

export function TournamentSettingsForm({ tournament }: Props) {
  const router = useRouter();
  const [name, setName] = useState(tournament.name);
  const [date, setDate] = useState(tournament.date);
  const [courtFee, setCourtFee] = useState(tournament.courtFee);
  const [partyFeePerPerson, setPartyFeePerPerson] = useState(tournament.partyFeePerPerson);
  const [description, setDescription] = useState(tournament.description);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateTournament({
        name,
        date,
        description,
        courtFee,
        partyFeePerPerson,
      });
      router.push("/more");
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name">大会名</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">開催日</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courtFee">コート代 (円)</Label>
              <Input
                id="courtFee"
                type="number"
                min={0}
                value={courtFee}
                onChange={(e) => setCourtFee(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partyFee">懇親会費/人 (円)</Label>
              <Input
                id="partyFee"
                type="number"
                min={0}
                value={partyFeePerPerson}
                onChange={(e) => setPartyFeePerPerson(Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 pt-6">
          <Label>大会説明 (Markdown)</Label>
          <div data-color-mode="light">
            <MDEditor
              value={description}
              onChange={(v) => setDescription(v ?? "")}
              height={300}
              preview="edit"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? "保存中..." : "保存"}
      </Button>
    </div>
  );
}
