import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateForm } from "@/components/templates/template-form";

export default async function NewTemplatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Template</h1>
        <p className="text-muted-foreground">Build a reusable workout routine</p>
      </div>
      <TemplateForm userId={user.id} />
    </div>
  );
}
