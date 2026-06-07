"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import {
  Archive,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Exercise } from "@/lib/types/database";

interface TemplateExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sortOrder: number;
}

interface TemplateFormProps {
  templateId?: string;
  initialName?: string;
  initialExercises?: TemplateExercise[];
  userId: string;
}

export function TemplateForm({
  templateId,
  initialName = "",
  initialExercises = [],
  userId,
}: TemplateFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [exercises, setExercises] = useState<TemplateExercise[]>(initialExercises);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const addExercise = (exercise: Exercise) => {
    if (exercises.some((entry) => entry.exerciseId === exercise.id)) {
      toast.error("Exercise already added");
      return;
    }
    setExercises([
      ...exercises,
      {
        id: uuidv4(),
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sortOrder: exercises.length,
      },
    ]);
  };

  const removeExercise = (id: string) => {
    setExercises(
      exercises
        .filter((entry) => entry.id !== id)
        .map((entry, index) => ({ ...entry, sortOrder: index }))
    );
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= exercises.length) return;
    const updated = [...exercises];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setExercises(updated.map((entry, i) => ({ ...entry, sortOrder: i })));
  };

  const saveExercises = async (id: string) => {
    const supabase = createClient();
    await supabase.from("workout_template_exercises").delete().eq("template_id", id);

    if (exercises.length > 0) {
      const { error } = await supabase.from("workout_template_exercises").insert(
        exercises.map((entry) => ({
          template_id: id,
          exercise_id: entry.exerciseId,
          sort_order: entry.sortOrder,
        }))
      );
      if (error) throw error;
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Routine name is required");
      return;
    }
    setLoading(true);
    const supabase = createClient();

    try {
      let id = templateId;
      if (id) {
        const { error } = await supabase
          .from("workout_templates")
          .update({ name: name.trim() })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { data: last } = await supabase
          .from("workout_templates")
          .select("sort_order")
          .eq("user_id", userId)
          .eq("is_archived", false)
          .order("sort_order", { ascending: false })
          .limit(1);

        const nextSortOrder = (last?.[0]?.sort_order ?? -1) + 1;

        const { data, error } = await supabase
          .from("workout_templates")
          .insert({
            name: name.trim(),
            user_id: userId,
            sort_order: nextSortOrder,
          })
          .select()
          .single();
        if (error) throw error;
        id = data.id;
      }

      await saveExercises(id!);

      toast.success(templateId ? "Routine updated" : "Routine created");
      router.push("/templates");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      const { data: last } = await supabase
        .from("workout_templates")
        .select("sort_order")
        .eq("user_id", userId)
        .eq("is_archived", false)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextSortOrder = (last?.[0]?.sort_order ?? -1) + 1;

      const { data, error } = await supabase
        .from("workout_templates")
        .insert({
          name: `${name.trim()} (Copy)`,
          user_id: userId,
          sort_order: nextSortOrder,
        })
        .select()
        .single();
      if (error) throw error;

      if (exercises.length > 0) {
        await supabase.from("workout_template_exercises").insert(
          exercises.map((entry) => ({
            template_id: data.id,
            exercise_id: entry.exerciseId,
            sort_order: entry.sortOrder,
          }))
        );
      }

      toast.success("Routine duplicated");
      router.push("/templates");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!templateId) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("workout_templates")
      .update({ is_archived: true })
      .eq("id", templateId);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Routine archived");
    router.push("/templates");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!templateId) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("workout_templates")
      .delete()
      .eq("id", templateId);
    setLoading(false);
    setShowDeleteDialog(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Routine deleted");
      router.push("/templates");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Routine Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Push Day"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Exercises</Label>
          <ExercisePicker
            onSelect={addExercise}
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            }
          />
        </div>

        {exercises.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No exercises added yet
          </p>
        ) : (
          exercises.map((entry, index) => (
            <Card key={entry.id}>
              <CardContent className="flex items-center gap-2 p-3">
                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={index === 0}
                    onClick={() => moveExercise(index, -1)}
                    aria-label="Move exercise up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={index === exercises.length - 1}
                    onClick={() => moveExercise(index, 1)}
                    aria-label="Move exercise down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <span className="flex-1 text-sm font-medium">
                  {index + 1}. {entry.exerciseName}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeExercise(entry.id)}
                  aria-label="Remove exercise"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Button className="w-full" onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : templateId ? "Update Routine" : "Create Routine"}
      </Button>

      {templateId && (
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleDuplicate}
            disabled={loading}
          >
            Duplicate Routine
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleArchive}
            disabled={loading}
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive Routine
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setShowDeleteDialog(true)}
            disabled={loading}
          >
            Delete Routine
          </Button>
        </div>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {name}?</DialogTitle>
            <DialogDescription>
              This permanently removes the routine. Past workouts are not deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
