"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getNow, setMockNow, getMockNow } from "@/lib/now";

function toDatetimeLocal(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${da}T${h}:${mi}`;
}

declare global {
  interface Window {
    __IS_TEST_ENV__?: boolean;
  }
}

export function TimeOverride() {
  const [isTestEnv, setIsTestEnv] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [active, setActive] = useState(false);

  useEffect(() => {
    setIsTestEnv(!!window.__IS_TEST_ENV__);
  }, []);

  useEffect(() => {
    if (open) {
      const current = getMockNow();
      if (current !== null) {
        setValue(toDatetimeLocal(current));
      } else {
        setValue(toDatetimeLocal(Date.now()));
      }
    }
  }, [open]);

  if (!isTestEnv) return null;

  function handleApply() {
    if (!value) return;
    const ts = new Date(value).getTime();
    if (isNaN(ts)) return;
    setMockNow(ts);
    setActive(true);
    setOpen(false);
  }

  function handleReset() {
    setMockNow(null);
    setActive(false);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed bottom-16 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-colors ${
          active
            ? "bg-destructive text-destructive-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        <Clock className="h-5 w-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>時刻オーバーライド</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>現在の時刻</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(getNow()).toLocaleString("ja-JP")}
                {active && " (オーバーライド中)"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mock-time">設定する時刻</Label>
              <Input
                id="mock-time"
                type="datetime-local"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleApply}>
                適用
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={!active}>
                リセット
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
