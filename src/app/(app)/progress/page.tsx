import { redirect } from "next/navigation";
import { Flame, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProgressData } from "@/lib/queries/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VolumeChart } from "@/components/charts/volume-chart";
import { FrequencyChart } from "@/components/charts/frequency-chart";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getProgressData(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-muted-foreground">Track your training trends</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">{data.totalWorkouts}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-3">
            <Flame className="mb-1 h-4 w-4 text-orange-500" />
            <p className="text-xl font-bold">{data.streak}</p>
            <p className="text-xs text-muted-foreground">Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">{data.frequency}</p>
            <p className="text-xs text-muted-foreground">Per week</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <VolumeChart data={data.weeklyData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workout Frequency</CardTitle>
        </CardHeader>
        <CardContent>
          <FrequencyChart data={data.weeklyData} />
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Personal Records</h2>
        </div>
        {data.personalRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground">No records yet</p>
        ) : (
          <div className="space-y-2">
            {data.personalRecords.map((pr) => (
              <Card key={pr.exerciseId}>
                <CardContent className="flex items-center justify-between p-3">
                  <span className="font-medium">{pr.exerciseName}</span>
                  <div className="text-right text-sm tabular-nums">
                    <p className="font-semibold">{pr.maxWeight} lbs max</p>
                    <p className="text-muted-foreground">
                      1RM: {Math.round(pr.max1RM)} lbs
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
