"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Exercise } from "@/lib/types/database";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  muscle_group: z.string().min(1, "Select a muscle group"),
  equipment_type: z.string().min(1, "Select equipment"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ExerciseFormProps {
  exercise?: Exercise;
  userId: string;
}

export function ExerciseForm({ exercise, userId }: ExerciseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: exercise?.name ?? "",
      muscle_group: exercise?.muscle_group ?? "",
      equipment_type: exercise?.equipment_type ?? "",
      description: exercise?.description ?? "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (exercise) {
        const { error } = await supabase
          .from("exercises")
          .update({
            name: data.name,
            muscle_group: data.muscle_group,
            equipment_type: data.equipment_type,
            description: data.description || null,
          })
          .eq("id", exercise.id);
        if (error) throw error;
        toast.success("Exercise updated");
      } else {
        const { error } = await supabase.from("exercises").insert({
          name: data.name,
          muscle_group: data.muscle_group,
          equipment_type: data.equipment_type,
          description: data.description || null,
          is_system: false,
          created_by: userId,
        });
        if (error) throw error;
        toast.success("Exercise created");
      }
      router.push("/exercises");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!exercise) return;
    setLoading(true);
    const { error } = await supabase
      .from("exercises")
      .update({ is_archived: true })
      .eq("id", exercise.id);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Exercise archived");
      router.push("/exercises");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Muscle Group</Label>
        <Select
          value={watch("muscle_group")}
          onValueChange={(v) => v && setValue("muscle_group", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select muscle group" />
          </SelectTrigger>
          <SelectContent>
            {MUSCLE_GROUPS.map((mg) => (
              <SelectItem key={mg.value} value={mg.value}>
                {mg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.muscle_group && (
          <p className="text-sm text-destructive">{errors.muscle_group.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Equipment</Label>
        <Select
          value={watch("equipment_type")}
          onValueChange={(v) => v && setValue("equipment_type", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select equipment" />
          </SelectTrigger>
          <SelectContent>
            {EQUIPMENT_TYPES.map((eq) => (
              <SelectItem key={eq.value} value={eq.value}>
                {eq.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.equipment_type && (
          <p className="text-sm text-destructive">{errors.equipment_type.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" {...register("description")} />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Saving..." : exercise ? "Update Exercise" : "Create Exercise"}
      </Button>

      {exercise && (
        <Button
          type="button"
          variant="destructive"
          className="w-full"
          onClick={handleArchive}
          disabled={loading}
        >
          Archive Exercise
        </Button>
      )}
    </form>
  );
}
