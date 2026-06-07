import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
        <p className="text-muted-foreground">Start tracking your gym progress</p>
      </div>
      <AuthForm mode="register" />
    </div>
  );
}
