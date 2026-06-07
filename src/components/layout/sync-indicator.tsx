"use client";

import { Cloud, CloudOff, Loader2, AlertCircle } from "lucide-react";
import { useWorkoutStore } from "@/stores/workout-store";
import { cn } from "@/lib/utils";

const labels = {
  saved: "Saved",
  saving: "Saving...",
  offline: "Offline — will sync",
  error: "Sync error",
};

const icons = {
  saved: Cloud,
  saving: Loader2,
  offline: CloudOff,
  error: AlertCircle,
};

export function SyncIndicator() {
  const syncStatus = useWorkoutStore((s) => s.syncStatus);
  const Icon = icons[syncStatus];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
        syncStatus === "saved" && "bg-emerald-500/10 text-emerald-500",
        syncStatus === "saving" && "bg-blue-500/10 text-blue-500",
        syncStatus === "offline" && "bg-amber-500/10 text-amber-500",
        syncStatus === "error" && "bg-red-500/10 text-red-500"
      )}
    >
      <Icon
        className={cn("h-3.5 w-3.5", syncStatus === "saving" && "animate-spin")}
      />
      <span>{labels[syncStatus]}</span>
    </div>
  );
}
