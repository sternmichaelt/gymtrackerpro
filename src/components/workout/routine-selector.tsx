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

export function RoutineSelector({
  routines,
  value,
  onSelect,
  disabled = false,
  loading = false,
  activeRoutineName = null,
}: RoutineSelectorProps) {
  const selectValue =
    value ?? (disabled && !value ? EMPTY_ROUTINE_VALUE : undefined);
  const showEmptyState = routines.length === 0 && !loading && !activeRoutineName;

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
      ) : routines.length === 0 && activeRoutineName ? (
        <div
          id="routine-select"
          className="flex h-11 w-full items-center rounded-lg border border-input bg-muted/30 px-3 text-sm"
        >
          {activeRoutineName}
        </div>
      ) : (
        <Select
          value={selectValue}
          onValueChange={(next) =>
            onSelect(next === EMPTY_ROUTINE_VALUE ? null : next)
          }
          disabled={disabled || loading}
        >
          <SelectTrigger id="routine-select" className="h-11 w-full">
            <SelectValue
              placeholder={loading ? "Loading routines..." : "Choose a routine..."}
            />
          </SelectTrigger>
          <SelectContent>
            {routines.map((routine) => {
              const count = getExerciseCount(routine);
              return (
                <SelectItem key={routine.id} value={routine.id}>
                  {routine.name}
                  {count === 0 ? " (no exercises)" : ` (${count} exercises)`}
                </SelectItem>
              );
            })}
            <SelectItem value={EMPTY_ROUTINE_VALUE}>Custom workout (no routine)</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
