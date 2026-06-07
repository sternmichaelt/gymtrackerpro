import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompletedSessions } from "@/lib/queries/workouts";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sessions = await getCompletedSessions(user.id, 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-muted-foreground">All completed workouts</p>
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No completed workouts yet.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <Link key={session.id} href={`/workouts/${session.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="space-y-1 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {session.routineName ??
                          (session.completed_at
                            ? new Date(session.completed_at).toLocaleDateString()
                            : "Workout")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.completed_at
                          ? new Date(session.completed_at).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })
                          : ""}{" "}
                        · {session.exerciseCount} exercises
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums">
                      {session.volume.toLocaleString()} lbs
                    </p>
                  </div>
                  {session.exerciseNames.length > 0 && (
                    <p className="truncate text-xs text-muted-foreground">
                      {session.exerciseNames.slice(0, 4).join(" · ")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
