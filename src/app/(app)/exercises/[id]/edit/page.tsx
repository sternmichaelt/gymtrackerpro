import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getExercise } from "@/lib/queries/exercises";
import { ExerciseForm } from "@/components/exercises/exercise-form";

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const exercise = await getExercise(id);
  if (!exercise || exercise.is_system) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Exercise</h1>
        <p className="text-muted-foreground">{exercise.name}</p>
      </div>
      <ExerciseForm exercise={exercise} userId={user.id} />
    </div>
  );
}
