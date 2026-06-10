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
      <div className="mx-auto flex max-w-lg items-end justify-around px-2 pt-2 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))]">
        {NAV_ITEMS.map((item) => {
          const Icon = icons[item.icon];
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-1.5 text-xs transition-all duration-200 ease-out",
                isActive
                  ? "-translate-y-1 border-primary bg-primary/10 text-primary shadow-md ring-1 ring-primary/25"
                  : "translate-y-0 border-border text-muted-foreground shadow-none hover:-translate-y-0.5 hover:border-primary/60 hover:bg-muted/40 hover:text-foreground hover:shadow-sm active:translate-y-0"
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
