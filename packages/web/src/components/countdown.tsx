"use client";

import { useEffect, useState } from "react";

export function Countdown({ targetTime }: { targetTime: string }) {
  const [minutes, setMinutes] = useState(() => calcMinutes(targetTime));

  useEffect(() => {
    const id = setInterval(() => setMinutes(calcMinutes(targetTime)), 60000);
    return () => clearInterval(id);
  }, [targetTime]);

  if (minutes <= 0) return null;

  return (
    <span className="text-muted-foreground">あと {minutes}分</span>
  );
}

function calcMinutes(time: string) {
  return Math.max(0, Math.round((new Date(time).getTime() - Date.now()) / 60000));
}
