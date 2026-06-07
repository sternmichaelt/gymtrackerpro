import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Dumbbell } from "lucide-react";

export default async function HomePage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/overview");
    }
  } catch {
    // Supabase not configured yet — show landing page
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Dumbbell className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">GymTrack Pro</h1>
        <p className="max-w-sm text-muted-foreground">
          Log sets in seconds. Track progress. Works offline at the gym.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button asChild size="lg">
          <Link href="/register">Get started</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </div>
  );
}
