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

      <div className="space-y-2">
        {sessions.map((session) => (
          <Link key={session.id} href={`/workouts/${session.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium">
                    {session.completed_at
                      ? new Date(session.completed_at).toLocaleDateString()
                      : "Workout"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {session.exerciseCount} exercises
                  </p>
                </div>
                <p className="font-semibold tabular-nums">
                  {session.volume.toLocaleString()} lbs
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
