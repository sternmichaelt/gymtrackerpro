import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/lib/supabase/client";
import { db } from "@/lib/offline/db";
import type { PendingMutation } from "@/lib/types/database";

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

export function initSyncEngine(onStatusChange: (online: boolean) => void) {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => {
    isOnline = true;
    onStatusChange(true);
    flushQueue();
  };

  const handleOffline = () => {
    isOnline = false;
    onStatusChange(false);
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

export function isNetworkOnline() {
  return isOnline;
}

export async function queueMutation(
  table: string,
  operation: "upsert" | "delete",
  payload: Record<string, unknown>
) {
  const mutation: PendingMutation = {
    id: uuidv4(),
    table,
    operation,
    payload,
    createdAt: new Date().toISOString(),
  };
  await db.pendingMutations.add(mutation);

  if (isOnline) {
    scheduleSync();
  }
}

export function scheduleSync(delay = 300) {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    flushQueue();
  }, delay);
}

export async function flushQueue(): Promise<boolean> {
  if (!isOnline) return false;

  const mutations = await db.pendingMutations.orderBy("createdAt").toArray();
  if (mutations.length === 0) return true;

  const supabase = createClient();
  let hasError = false;

  for (const mutation of mutations) {
    try {
      if (mutation.operation === "upsert") {
        const { error } = await supabase
          .from(mutation.table)
          .upsert(mutation.payload);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(mutation.table)
          .delete()
          .eq("id", mutation.payload.id as string);
        if (error) throw error;
      }
      await db.pendingMutations.delete(mutation.id);
    } catch {
      hasError = true;
      break;
    }
  }

  return !hasError;
}
