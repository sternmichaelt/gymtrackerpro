"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MUSCLE_GROUPS } from "@/lib/constants";
import type { Exercise } from "@/lib/types/database";

interface ExercisePickerProps {
  onSelect: (exercise: Exercise) => void;
  trigger: React.ReactElement;
}

export function ExercisePicker({ onSelect, trigger }: ExercisePickerProps) {
  const [open, setOpen] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("exercises")
      .select("*")
      .eq("is_archived", false)
      .order("name");

    if (search) query = query.ilike("name", `%${search}%`);
    if (muscleFilter) query = query.eq("muscle_group", muscleFilter);

    query.then(({ data }) => {
      setExercises((data as Exercise[]) ?? []);
      setLoading(false);
    });
  }, [open, search, muscleFilter]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={trigger}
        nativeButton={false}
      />
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle>Add Exercise</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={muscleFilter === null ? "default" : "outline"}
              onClick={() => setMuscleFilter(null)}
            >
              All
            </Button>
            {MUSCLE_GROUPS.map((mg) => (
              <Button
                key={mg.value}
                size="sm"
                variant={muscleFilter === mg.value ? "default" : "outline"}
                onClick={() => setMuscleFilter(mg.value)}
              >
                {mg.label}
              </Button>
            ))}
          </div>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {loading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : exercises.length === 0 ? (
              <p className="text-center text-muted-foreground">No exercises found</p>
            ) : (
              exercises.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left hover:bg-muted/50"
                  onClick={() => {
                    onSelect(ex);
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">{ex.name}</span>
                  <Badge variant="secondary">{ex.muscle_group}</Badge>
                </button>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
