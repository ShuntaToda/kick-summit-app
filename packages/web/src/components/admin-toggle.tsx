"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, PenLine, ChevronRight, LogOut } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminToggle() {
  const { isAdmin, login, logout } = useAdmin();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await login(password);
    if (ok) {
      setOpen(false);
      setPassword("");
      setError(false);
    } else {
      setError(true);
    }
  }

  if (isAdmin) {
    return (
      <div className="space-y-1">
        <Link
          href="/admin/score"
          className="flex items-center justify-between rounded-md border px-4 py-3 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <PenLine className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">スコア入力</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md border px-4 py-3 transition-colors hover:bg-accent"
        >
          <LogOut className="h-5 w-5 text-destructive" />
          <span className="text-sm font-medium text-destructive">
            管理者モードを解除
          </span>
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-md border px-4 py-3 transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">管理者ログイン</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>管理者モード</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">
                  パスワードが正しくありません
                </p>
              )}
            </div>
            <Button type="submit" className="w-full">
              ログイン
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
