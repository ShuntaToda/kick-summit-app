"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, TableProperties, Trophy, EllipsisVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/timetable", label: "タイムテーブル", icon: Calendar },
  { href: "/league", label: "リーグ表", icon: TableProperties },
  { href: "/tournament", label: "トーナメント", icon: Trophy },
  { href: "/more", label: "その他", icon: EllipsisVertical },
];

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  if (href === "/more") return pathname.startsWith("/more") || pathname.startsWith("/admin");
  return pathname.startsWith(href);
}

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                active
                  ? "font-semibold text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-6 rounded-full bg-primary" />
              )}
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
