"use client";

import { Minus, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickLogPadProps {
  weight: number | null;
  reps: number | null;
  onWeightChange: (weight: number) => void;
  onRepsChange: (reps: number) => void;
  onComplete: () => void;
}

function Stepper({
  label,
  value,
  onDecrease,
  onIncrease,
  unit,
}: {
  label: string;
  value: number | null;
  onDecrease: () => void;
  onIncrease: () => void;
  unit?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={onDecrease}
        >
          <Minus className="h-5 w-5" />
        </Button>
        <div className="min-w-[80px] text-center">
          <span className="text-3xl font-bold tabular-nums">
            {value ?? "—"}
          </span>
          {unit && (
            <span className="ml-1 text-sm text-muted-foreground">{unit}</span>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={onIncrease}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

export function QuickLogPad({
  weight,
  reps,
  onWeightChange,
  onRepsChange,
  onComplete,
}: QuickLogPadProps) {
  const currentWeight = weight ?? 0;
  const currentReps = reps ?? 0;

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-4">
      <div className="grid grid-cols-2 gap-6">
        <Stepper
          label="Weight"
          value={weight}
          unit="lbs"
          onDecrease={() => onWeightChange(Math.max(0, currentWeight - 5))}
          onIncrease={() => onWeightChange(currentWeight + 5)}
        />
        <Stepper
          label="Reps"
          value={reps}
          onDecrease={() => onRepsChange(Math.max(0, currentReps - 1))}
          onIncrease={() => onRepsChange(currentReps + 1)}
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onWeightChange(currentWeight + 2.5)}
        >
          +2.5 lbs
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onWeightChange(Math.max(0, currentWeight - 2.5))}
        >
          -2.5 lbs
        </Button>
      </div>

      <Button
        className={cn("h-14 w-full text-base font-semibold")}
        onClick={onComplete}
        disabled={!weight || !reps}
      >
        <Check className="mr-2 h-5 w-5" />
        Complete Set
      </Button>
    </div>
  );
}
