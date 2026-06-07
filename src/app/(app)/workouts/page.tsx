import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveSession,
  getCompletedSessions,
  getLastRoutineSets,
  getRoutineDefaultsForTemplates,
  getSessionDetail,
  getTemplateLastPerformed,
  getWorkoutHubStats,
} from "@/lib/queries/workouts";
import { ensureExampleRoutine, getTemplates } from "@/lib/queries/templates";
import { WorkoutsHub } from "@/components/workout/workouts-hub";

export const dynamic = "force-dynamic";

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensureExampleRoutine(user.id);

  const [sessions, activeSession, templates, stats] = await Promise.all([
    getCompletedSessions(user.id),
    getActiveSession(user.id),
    getTemplates(user.id),
    getWorkoutHubStats(user.id),
  ]);

  const templateIds = templates.map((template) => template.id);
  const [routineDefaults, lastPerformed] = await Promise.all([
    getRoutineDefaultsForTemplates(user.id, templateIds),
    getTemplateLastPerformed(user.id, templateIds),
  ]);

  const activeSessionDetail = activeSession
    ? await getSessionDetail(activeSession.id)
    : null;
  const activeDefaults =
    activeSessionDetail?.template_id
      ? await getLastRoutineSets(user.id, activeSessionDetail.template_id)
      : {};

  return (
    <WorkoutsHub
      userId={user.id}
      templates={templates}
      sessions={sessions}
      routineDefaults={routineDefaults}
      lastPerformed={lastPerformed}
      stats={stats}
      activeSession={activeSessionDetail}
      activeDefaults={activeDefaults}
    />
  );
}
