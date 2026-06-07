import { BottomNav } from "@/components/layout/bottom-nav";
import { WorkoutRecovery } from "@/components/workout/workout-recovery";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="mx-auto max-w-lg px-4 py-4">{children}</main>
      <BottomNav />
      <WorkoutRecovery />
    </div>
  );
}
