import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Flame, Trophy, Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/queries/analytics";
import { getActiveSession } from "@/lib/queries/workouts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function OverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [stats, activeSession] = await Promise.all([
    getDashboardStats(user.id),
    getActiveSession(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">Your training at a glance</p>
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
        <Button asChild size="lg" className="h-14 w-full text-base">
          <Link href="/workouts">
            <Plus className="mr-2 h-5 w-5" />
            Start Workout
          </Link>
        </Button>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Dumbbell className="mb-2 h-5 w-5 text-primary" />
            <span className="text-2xl font-bold">{stats.weekWorkouts}</span>
            <span className="text-xs text-muted-foreground">This week</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Flame className="mb-2 h-5 w-5 text-orange-500" />
            <span className="text-2xl font-bold">{stats.streak}</span>
            <span className="text-xs text-muted-foreground">Day streak</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tabular-nums">
            {stats.weekVolume.toLocaleString()}
            <span className="ml-1 text-sm font-normal text-muted-foreground">lbs</span>
          </p>
          <p className="text-sm text-muted-foreground">Total volume</p>
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Top Records</h2>
        </div>
        {stats.personalRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Complete workouts to see your personal records
          </p>
        ) : (
          <div className="space-y-2">
            {stats.personalRecords.map((pr) => (
              <Card key={pr.exerciseId}>
                <CardContent className="flex items-center justify-between p-3">
                  <span className="font-medium">{pr.exerciseName}</span>
                  <div className="text-right text-sm">
                    <p className="font-semibold tabular-nums">{pr.maxWeight} lbs</p>
                    <p className="text-muted-foreground">
                      Est. 1RM: {Math.round(pr.max1RM)} lbs
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
