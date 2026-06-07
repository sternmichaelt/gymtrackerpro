"use client";

import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { SavedRoutine } from "@/lib/queries/templates-client";

export const EMPTY_ROUTINE_VALUE = "__empty__";

interface RoutineSelectorProps {
  routines: SavedRoutine[];
  value: string | null;
  onSelect: (templateId: string | null) => void;
  readOnly?: boolean;
  loading?: boolean;
  fallbackLabel?: string | null;
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

export function RoutineSelector({
  routines,
  value,
  onSelect,
  readOnly = false,
  loading = false,
  fallbackLabel = null,
}: RoutineSelectorProps) {
  const matchedRoutine = value
    ? routines.find((routine) => routine.id === value)
    : null;
  const displayLabel =
    matchedRoutine != null ? getRoutineLabel(matchedRoutine) : fallbackLabel;
  const selectValue = matchedRoutine?.id;
  const showEmptyState = routines.length === 0 && !loading && !displayLabel;

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
          value={selectValue}
          onValueChange={(next) =>
            onSelect(next === EMPTY_ROUTINE_VALUE ? null : next)
          }
          disabled={readOnly || loading}
        >
          <SelectTrigger id="routine-select" className="h-11 w-full">
            <span className="flex flex-1 truncate text-left">
              {displayLabel ??
                (loading ? "Loading routines..." : "Choose a routine...")}
            </span>
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
