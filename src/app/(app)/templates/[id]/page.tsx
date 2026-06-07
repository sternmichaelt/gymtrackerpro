import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/queries/templates";
import { TemplateForm } from "@/components/templates/template-form";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const template = await getTemplate(id);
  if (!template) notFound();

  const exercises = (template.workout_template_exercises ?? [])
    .sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    )
    .map(
      (te: {
        id: string;
        exercise_id: string;
        sort_order: number;
        exercises: { name: string } | null;
      }) => ({
        id: te.id,
        exerciseId: te.exercise_id,
        exerciseName: te.exercises?.name ?? "Unknown",
        sortOrder: te.sort_order,
      })
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Routine</h1>
        <p className="text-muted-foreground">{template.name}</p>
      </div>
      <TemplateForm
        templateId={template.id}
        initialName={template.name}
        initialExercises={exercises}
        userId={user.id}
      />
    </div>
  );
}
