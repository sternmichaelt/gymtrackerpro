import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSession, getCompletedSessions, getRoutineDefaultsForTemplates } from "@/lib/queries/workouts";
import { ensureExampleRoutine, getTemplates } from "@/lib/queries/templates";
import { workoutDurationMinutes } from "@/lib/analytics";
import { StartWorkoutForm } from "@/components/workout/start-workout-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensureExampleRoutine(user.id);
  const [sessions, activeSession, templates] = await Promise.all([
    getCompletedSessions(user.id),
    getActiveSession(user.id),
    getTemplates(user.id),
  ]);
  const routineDefaults = await getRoutineDefaultsForTemplates(
    user.id,
    templates.map((template) => template.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workouts</h1>
        <p className="text-muted-foreground">Select a routine and track your sets</p>
      </div>

      {activeSession ? (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">Workout in progress</p>
              <Badge>{activeSession.status}</Badge>
            </div>
            <Button asChild>
              <Link href={`/workouts/${activeSession.id}`}>Continue</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <StartWorkoutForm
          templates={templates}
          userId={user.id}
          routineDefaults={routineDefaults}
        />
      )}

      {sessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Recent workouts</h2>
          {sessions.map((session) => (
            <Link key={session.id} href={`/workouts/${session.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">
                      {session.completed_at
                        ? new Date(session.completed_at).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })
                        : "Workout"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {session.exerciseCount} exercises ·{" "}
                      {workoutDurationMinutes(
                        session.started_at,
                        session.completed_at,
                        session.paused_at
                      )}{" "}
                      min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">
                      {session.volume.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">lbs volume</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button asChild variant="outline" className="flex-1">
          <Link href="/exercises">Browse Exercises</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/history">View History</Link>
        </Button>
      </div>
    </div>
  );
}
