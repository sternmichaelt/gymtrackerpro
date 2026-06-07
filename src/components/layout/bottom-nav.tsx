"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Dumbbell,
  Home,
  LayoutTemplate,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";

const icons = {
  home: Home,
  dumbbell: Dumbbell,
  layout: LayoutTemplate,
  chart: BarChart3,
  settings: Settings,
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2 pb-safe">
        {NAV_ITEMS.map((item) => {
          const Icon = icons[item.icon];
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
