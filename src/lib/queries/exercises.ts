import { createClient } from "@/lib/supabase/server";
import type { EquipmentType, MuscleGroup } from "@/lib/types/database";

export async function getExercises(filters?: {
  search?: string;
  muscleGroup?: MuscleGroup;
  equipmentType?: EquipmentType;
  includeCustom?: boolean;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("exercises")
    .select("*")
    .eq("is_archived", false)
    .order("name");

  if (filters?.search) query = query.ilike("name", `%${filters.search}%`);
  if (filters?.muscleGroup) query = query.eq("muscle_group", filters.muscleGroup);
  if (filters?.equipmentType) query = query.eq("equipment_type", filters.equipmentType);

  const { data } = await query;
  return data ?? [];
}

export async function getExercise(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}
