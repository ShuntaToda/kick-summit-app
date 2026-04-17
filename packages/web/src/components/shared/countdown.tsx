"use client";

import { useEffect, useState } from "react";
import { getNow, onNowChange } from "@/lib/now";

export function Countdown({ targetTime }: { targetTime: string }) {
  const [minutes, setMinutes] = useState(() => calcMinutes(targetTime));

  useEffect(() => {
    const id = setInterval(() => setMinutes(calcMinutes(targetTime)), 60000);
    const unsub = onNowChange(() => setMinutes(calcMinutes(targetTime)));
    return () => { clearInterval(id); unsub(); };
  }, [targetTime]);

  if (minutes <= 0) return null;

  return (
    <span className="text-muted-foreground">あと {minutes}分</span>
  );
}

function calcMinutes(time: string) {
  return Math.max(0, Math.round((new Date(time).getTime() - getNow()) / 60000));
}
