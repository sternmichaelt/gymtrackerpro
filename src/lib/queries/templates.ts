import { createClient } from "@/lib/supabase/server";

export async function getTemplates(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_templates")
    .select(`
      *,
      workout_template_exercises (
        id,
        sort_order,
        exercises (id, name, muscle_group)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getTemplate(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_templates")
    .select(`
      *,
      workout_template_exercises (
        id,
        sort_order,
        exercise_id,
        exercises (*)
      )
    `)
    .eq("id", id)
    .single();
  return data;
}
