"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActiveWorkoutSet } from "@/lib/types/database";

interface SetRowProps {
  set: ActiveWorkoutSet;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function SetRow({ set, isActive, onSelect, onDelete }: SetRowProps) {
  const isComplete = set.weight != null && set.reps != null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
        isActive ? "border-primary bg-primary/5" : "border-border",
        isComplete && !isActive && "opacity-70"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 items-center gap-4 text-left"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
          {set.setNumber}
        </span>
        <div className="flex gap-6 tabular-nums">
          <span>
            <span className="text-muted-foreground">Wt </span>
            <span className="font-medium">{set.weight ?? "—"}</span>
          </span>
          <span>
            <span className="text-muted-foreground">Reps </span>
            <span className="font-medium">{set.reps ?? "—"}</span>
          </span>
        </div>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
