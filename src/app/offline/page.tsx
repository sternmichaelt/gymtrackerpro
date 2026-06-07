import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <WifiOff className="h-12 w-12 text-muted-foreground" />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">You&apos;re offline</h1>
        <p className="max-w-sm text-muted-foreground">
          Your workout data is saved locally and will sync when you reconnect.
        </p>
      </div>
      <Button asChild>
        <Link href="/overview">Go to Overview</Link>
      </Button>
    </div>
  );
}
