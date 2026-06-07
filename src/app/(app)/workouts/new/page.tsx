import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoutineDefaultsForTemplates } from "@/lib/queries/workouts";
import { ensureExampleRoutine, getTemplates } from "@/lib/queries/templates";
import { StartWorkoutForm } from "@/components/workout/start-workout-form";

export default async function NewWorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensureExampleRoutine(user.id);
  const templates = await getTemplates(user.id);
  const routineDefaults = await getRoutineDefaultsForTemplates(
    user.id,
    templates.map((template) => template.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Start Workout</h1>
        <p className="text-muted-foreground">Choose a routine or start blank</p>
      </div>
      <StartWorkoutForm
        templates={templates}
        userId={user.id}
        routineDefaults={routineDefaults}
      />
    </div>
  );
}
