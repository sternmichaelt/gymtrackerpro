"use client";

import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { SavedRoutine } from "@/lib/queries/templates-client";

export const EMPTY_ROUTINE_VALUE = "__empty__";

interface RoutineSelectorProps {
  routines: SavedRoutine[];
  value: string | null;
  onSelect: (templateId: string | null) => void;
  disabled?: boolean;
  loading?: boolean;
  activeRoutineName?: string | null;
}

function getExerciseCount(routine: SavedRoutine) {
  return (routine.workout_template_exercises ?? []).filter(
    (entry) => entry.exercises != null
  ).length;
}

function getRoutineLabel(routine: SavedRoutine) {
  const count = getExerciseCount(routine);
  return `${routine.name}${count === 0 ? " (no exercises)" : ` (${count} exercises)`}`;
}

function resolveDisplayLabel(
  routines: SavedRoutine[],
  value: string | null,
  activeRoutineName?: string | null
) {
  if (activeRoutineName) return activeRoutineName;
  if (!value || value === EMPTY_ROUTINE_VALUE) return "Custom workout (no routine)";
  const routine = routines.find((item) => item.id === value);
  return routine ? getRoutineLabel(routine) : null;
}

export function RoutineSelector({
  routines,
  value,
  onSelect,
  disabled = false,
  loading = false,
  activeRoutineName = null,
}: RoutineSelectorProps) {
  const displayLabel = resolveDisplayLabel(routines, value, activeRoutineName);
  const showEmptyState = routines.length === 0 && !loading && !displayLabel;

  if (disabled || activeRoutineName) {
    return (
      <div className="space-y-2">
        <Label htmlFor="routine-select">Workout Routine</Label>
        <div
          id="routine-select"
          className="flex h-11 w-full items-center rounded-lg border border-input bg-muted/30 px-3 text-sm font-medium"
        >
          {displayLabel ?? "Custom workout"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="routine-select">Workout Routine</Label>
      {showEmptyState ? (
        <p className="text-sm text-muted-foreground">
          No routines yet.{" "}
          <Link href="/templates/new" className="text-primary underline">
            Create one on the Routines page
          </Link>
        </p>
      ) : (
        <Select
          value={value ?? undefined}
          onValueChange={(next) =>
            onSelect(next === EMPTY_ROUTINE_VALUE ? null : next)
          }
          disabled={loading}
        >
          <SelectTrigger id="routine-select" className="h-11 w-full">
            {displayLabel ? (
              <span className="flex flex-1 truncate text-left">{displayLabel}</span>
            ) : (
              <SelectValue
                placeholder={loading ? "Loading routines..." : "Choose a routine..."}
              />
            )}
          </SelectTrigger>
          <SelectContent>
            {routines.map((routine) => (
              <SelectItem key={routine.id} value={routine.id}>
                {getRoutineLabel(routine)}
              </SelectItem>
            ))}
            <SelectItem value={EMPTY_ROUTINE_VALUE}>Custom workout (no routine)</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
