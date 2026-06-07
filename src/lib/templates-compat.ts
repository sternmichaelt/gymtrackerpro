export function isMissingTemplateColumnError(
  error: { code?: string; message?: string } | null
) {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    message.includes("is_archived") ||
    message.includes("sort_order")
  );
}
