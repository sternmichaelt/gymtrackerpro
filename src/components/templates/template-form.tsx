"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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

  const addExercise = (exercise: Exercise) => {
    if (exercises.some((e) => e.exerciseId === exercise.id)) {
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
        .filter((e) => e.id !== id)
        .map((e, i) => ({ ...e, sortOrder: i }))
    );
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= exercises.length) return;
    const updated = [...exercises];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setExercises(updated.map((e, i) => ({ ...e, sortOrder: i })));
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
          .update({ name })
          .eq("id", id);
        if (error) throw error;
        await supabase
          .from("workout_template_exercises")
          .delete()
          .eq("template_id", id);
      } else {
        const { data, error } = await supabase
          .from("workout_templates")
          .insert({ name, user_id: userId })
          .select()
          .single();
        if (error) throw error;
        id = data.id;
      }

      if (exercises.length > 0) {
        const { error } = await supabase.from("workout_template_exercises").insert(
          exercises.map((e) => ({
            template_id: id,
            exercise_id: e.exerciseId,
            sort_order: e.sortOrder,
          }))
        );
        if (error) throw error;
      }

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
      const { data, error } = await supabase
        .from("workout_templates")
        .insert({ name: `${name} (Copy)`, user_id: userId })
        .select()
        .single();
      if (error) throw error;

      if (exercises.length > 0) {
        await supabase.from("workout_template_exercises").insert(
          exercises.map((e) => ({
            template_id: data.id,
            exercise_id: e.exerciseId,
            sort_order: e.sortOrder,
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

  const handleDelete = async () => {
    if (!templateId) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("workout_templates")
      .delete()
      .eq("id", templateId);
    setLoading(false);
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
          onChange={(e) => setName(e.target.value)}
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
          exercises.map((ex, index) => (
            <Card key={ex.id}>
              <CardContent className="flex items-center gap-2 p-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveExercise(index, -1)}
                    disabled={index === 0}
                    className="text-muted-foreground disabled:opacity-30"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </div>
                <span className="flex-1 font-medium">{ex.exerciseName}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExercise(ex.id)}
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDuplicate}
            disabled={loading}
          >
            Duplicate
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleDelete}
            disabled={loading}
          >
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
