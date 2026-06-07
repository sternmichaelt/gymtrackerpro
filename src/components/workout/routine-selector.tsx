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
import type { Exercise } from "@/lib/types/database";

export const EMPTY_ROUTINE_VALUE = "__empty__";

interface RoutineTemplate {
  id: string;
  name: string;
  workout_template_exercises?: {
    sort_order: number;
    exercises: Exercise | null;
  }[];
}

interface RoutineSelectorProps {
  templates: RoutineTemplate[];
  value: string | null;
  onSelect: (templateId: string | null) => void;
  disabled?: boolean;
  loading?: boolean;
}

function getExerciseCount(template: RoutineTemplate) {
  return (template.workout_template_exercises ?? []).filter(
    (entry) => entry.exercises != null
  ).length;
}

export function RoutineSelector({
  templates,
  value,
  onSelect,
  disabled = false,
  loading = false,
}: RoutineSelectorProps) {
  const selectValue = value ?? (disabled ? EMPTY_ROUTINE_VALUE : undefined);

  return (
    <div className="space-y-2">
      <Label htmlFor="routine-select">Workout Routine</Label>
      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No routines yet.{" "}
          <Link href="/templates/new" className="text-primary underline">
            Create one
          </Link>
        </p>
      ) : (
        <Select
          value={selectValue}
          onValueChange={(next) =>
            onSelect(next === EMPTY_ROUTINE_VALUE ? null : next)
          }
          disabled={disabled || loading}
        >
          <SelectTrigger id="routine-select" className="h-11 w-full">
            <SelectValue placeholder="Choose a routine..." />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => {
              const count = getExerciseCount(template);
              return (
                <SelectItem
                  key={template.id}
                  value={template.id}
                  disabled={count === 0}
                >
                  {template.name}
                  {count === 0 ? " (no exercises)" : ` (${count})`}
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
