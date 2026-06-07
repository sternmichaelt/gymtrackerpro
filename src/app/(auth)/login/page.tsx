import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">GymTrack Pro</h1>
        <p className="text-muted-foreground">Sign in to track your workouts</p>
      </div>
      <AuthForm mode="login" />
    </div>
  );
}
