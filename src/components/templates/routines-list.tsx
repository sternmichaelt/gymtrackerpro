"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Routine {
  id: string;
  name: string;
  sort_order: number;
  workout_template_exercises?: { id: string }[];
}

interface RoutinesListProps {
  activeRoutines: Routine[];
  archivedRoutines: Routine[];
}

async function saveRoutineOrder(routines: Routine[]) {
  const supabase = createClient();
  await Promise.all(
    routines.map((routine, index) =>
      supabase
        .from("workout_templates")
        .update({ sort_order: index })
        .eq("id", routine.id)
    )
  );
}

export function RoutinesList({
  activeRoutines: initialActive,
  archivedRoutines: initialArchived,
}: RoutinesListProps) {
  const router = useRouter();
  const [activeRoutines, setActiveRoutines] = useState(initialActive);
  const [archivedRoutines, setArchivedRoutines] = useState(initialArchived);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Routine | null>(null);

  const moveRoutine = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= activeRoutines.length) return;

    const reordered = [...activeRoutines];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setActiveRoutines(reordered);

    try {
      await saveRoutineOrder(reordered);
      router.refresh();
    } catch {
      setActiveRoutines(initialActive);
      toast.error("Could not reorder routines");
    }
  };

  const archiveRoutine = async (routine: Routine) => {
    setLoadingId(routine.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("workout_templates")
      .update({ is_archived: true })
      .eq("id", routine.id);

    setLoadingId(null);
    if (error) {
      toast.error("Could not archive routine");
      return;
    }

    setActiveRoutines((current) => current.filter((item) => item.id !== routine.id));
    setArchivedRoutines((current) => [routine, ...current]);
    toast.success("Routine archived");
    router.refresh();
  };

  const restoreRoutine = async (routine: Routine) => {
    setLoadingId(routine.id);
    const supabase = createClient();

    const { data: last } = await supabase
      .from("workout_templates")
      .select("sort_order")
      .eq("is_archived", false)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextSortOrder = (last?.[0]?.sort_order ?? -1) + 1;

    const { error } = await supabase
      .from("workout_templates")
      .update({ is_archived: false, sort_order: nextSortOrder })
      .eq("id", routine.id);

    setLoadingId(null);
    if (error) {
      toast.error("Could not restore routine");
      return;
    }

    setArchivedRoutines((current) => current.filter((item) => item.id !== routine.id));
    setActiveRoutines((current) => [...current, { ...routine, sort_order: nextSortOrder }]);
    toast.success("Routine restored");
    router.refresh();
  };

  const deleteRoutine = async () => {
    if (!deleteTarget) return;
    setLoadingId(deleteTarget.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("workout_templates")
      .delete()
      .eq("id", deleteTarget.id);

    setLoadingId(null);
    setDeleteTarget(null);

    if (error) {
      toast.error("Could not delete routine");
      return;
    }

    setArchivedRoutines((current) =>
      current.filter((item) => item.id !== deleteTarget.id)
    );
    toast.success("Routine deleted");
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {activeRoutines.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No active routines</p>
            <Button asChild className="mt-4">
              <Link href="/templates/new">Create your first routine</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {activeRoutines.map((routine, index) => (
            <Card key={routine.id}>
              <CardContent className="flex items-center gap-2 p-3">
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={index === 0 || loadingId === routine.id}
                    onClick={() => moveRoutine(index, -1)}
                    aria-label="Move routine up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={
                      index === activeRoutines.length - 1 || loadingId === routine.id
                    }
                    onClick={() => moveRoutine(index, 1)}
                    aria-label="Move routine down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                <Link href={`/templates/${routine.id}`} className="min-w-0 flex-1">
                  <p className="font-medium">{routine.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {routine.workout_template_exercises?.length ?? 0} exercises
                  </p>
                </Link>

                <Button asChild variant="outline" size="sm">
                  <Link href={`/templates/${routine.id}`}>
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={loadingId === routine.id}
                  onClick={() => archiveRoutine(routine)}
                  aria-label="Archive routine"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3 border-t pt-6">
        <div>
          <h2 className="text-lg font-semibold">Archived Routines</h2>
          <p className="text-sm text-muted-foreground">
            Hidden from workouts but kept for later. Restore or delete permanently.
          </p>
        </div>

        {archivedRoutines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No archived routines.</p>
        ) : (
          <div className="space-y-2">
            {archivedRoutines.map((routine) => (
              <Card key={routine.id} className="bg-muted/30">
                <CardContent className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="font-medium">{routine.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {routine.workout_template_exercises?.length ?? 0} exercises
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingId === routine.id}
                      onClick={() => restoreRoutine(routine)}
                    >
                      <ArchiveRestore className="mr-1 h-3.5 w-3.5" />
                      Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      disabled={loadingId === routine.id}
                      onClick={() => setDeleteTarget(routine)}
                      aria-label="Delete routine"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
            <DialogDescription>
              This permanently removes the routine. Workout history is not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteRoutine}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
