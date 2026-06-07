import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getExercises } from "@/lib/queries/exercises";
import { ExerciseList } from "@/components/exercises/exercise-list";

export default async function ExercisesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const exercises = await getExercises();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exercises</h1>
        <p className="text-muted-foreground">Browse and manage your exercise library</p>
      </div>
      <ExerciseList exercises={exercises} />
    </div>
  );
}
