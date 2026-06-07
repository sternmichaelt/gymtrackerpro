import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureExampleRoutine, getTemplates } from "@/lib/queries/templates";
import { getRoutineDefaultsForTemplates } from "@/lib/queries/workouts";
import { WorkoutsHub } from "@/components/workout/workouts-hub";

export const dynamic = "force-dynamic";

export default async function WorkoutsPage() {
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
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      }
    >
      <WorkoutsHub
        userId={user.id}
        templates={templates}
        routineDefaults={routineDefaults}
      />
    </Suspense>
  );
}
