import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCompletedSessions } from "@/lib/queries/workouts";
import { workoutDurationMinutes } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sessions = await getCompletedSessions(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workouts</h1>
          <p className="text-muted-foreground">Your training history</p>
        </div>
        <Button asChild size="sm">
          <Link href="/workouts/new">
            <Plus className="mr-1 h-4 w-4" />
            New
          </Link>
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No workouts yet</p>
            <Button asChild className="mt-4">
              <Link href="/workouts/new">Start your first workout</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
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
    </div>
  );
}
