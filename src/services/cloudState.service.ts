import { supabase } from "@/lib/supabaseClient";
import { getNetworkStatus } from "@/services/network.service";
import type { AppState } from "@/types/app.types";

const SESSION_TIMEOUT_MS = 3000;

async function getUserId(): Promise<string | null> {
  // OFFLINE-FIRST: Check network before calling getSession() which can hang
  // when the JWT is expired and the device is offline
  const isOnline = await getNetworkStatus();
  if (!isOnline) return null;

  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("getSession timeout")), SESSION_TIMEOUT_MS)
      ),
    ]);
    if (result.error) return null;
    return result.data.session?.user?.id ?? null;
  } catch {
    // Timeout or error
    return null;
  }
}

export async function getCloudState(): Promise<AppState | null> {
  const isOnline = await getNetworkStatus();
  const userId = await getUserId();

  if (!userId) {
    // If online but couldn't get userId, Supabase auth is likely unavailable
    if (isOnline) {
      throw new Error("Could not get user session (Supabase may be unavailable)");
    }
    return null; // Truly offline — returning null is correct
  }

  const { data, error } = await supabase
    .from("user_state")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.state) return null;

  return data.state as AppState;
}

export async function upsertCloudState(state: AppState): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase.from("user_state").upsert(
    {
      user_id: userId,
      state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}
