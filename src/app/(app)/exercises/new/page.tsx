import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExerciseForm } from "@/components/exercises/exercise-form";

export default async function NewExercisePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Exercise</h1>
        <p className="text-muted-foreground">Create a custom exercise</p>
      </div>
      <ExerciseForm userId={user.id} />
    </div>
  );
}
