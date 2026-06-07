import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLastRoutineSets, getSessionDetail } from "@/lib/queries/workouts";
import { ActiveWorkout } from "@/components/workout/active-workout";
import { WorkoutDetail } from "@/components/workout/workout-detail";
import { WorkoutLoader } from "@/components/workout/workout-loader";

export default async function WorkoutPage({
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

  const session = await getSessionDetail(id);
  if (!session) redirect("/workouts");

  if (session.status === "in_progress" || session.status === "paused") {
    const previousDefaults = session.template_id
      ? await getLastRoutineSets(user.id, session.template_id)
      : {};

    return (
      <>
        <WorkoutLoader session={session} previousDefaults={previousDefaults} />
        <ActiveWorkout />
      </>
    );
  }

  return <WorkoutDetail session={session} />;
}
