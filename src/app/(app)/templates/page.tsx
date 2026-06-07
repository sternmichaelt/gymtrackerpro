import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ensureExampleRoutine, getTemplates, supportsTemplateArchive } from "@/lib/queries/templates";
import { RoutinesList } from "@/components/templates/routines-list";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensureExampleRoutine(user.id);

  const archiveEnabled = await supportsTemplateArchive();
  const [activeRoutines, archivedRoutines] = await Promise.all([
    getTemplates(user.id, false),
    archiveEnabled ? getTemplates(user.id, true) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Routines</h1>
          <p className="text-muted-foreground">Manage, reorder, and archive your routines</p>
        </div>
        <Button asChild size="sm">
          <Link href="/templates/new">
            <Plus className="mr-1 h-4 w-4" />
            New
          </Link>
        </Button>
      </div>

      <RoutinesList
        activeRoutines={activeRoutines}
        archivedRoutines={archivedRoutines}
        archiveEnabled={archiveEnabled}
      />
    </div>
  );
}
