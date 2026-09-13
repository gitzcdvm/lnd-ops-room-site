"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  describeError,
  getSupabase,
  readSupabaseConfig,
} from "./lib/supabase";

const OUTCOME_LABEL = {
  reminder_sent: "Reminder sent",
  signed_off: "Signed off",
} as const;

type OutcomeKey = keyof typeof OUTCOME_LABEL;

function backToBoard(message: string): string {
  return `/?error=${encodeURIComponent(message)}`;
}

/**
 * Records one outcome against one chase item.
 *
 * Validates before it writes: no id, an unknown outcome, a missing setting,
 * a refused write, or a row that is already signed off or no longer exists,
 * all stop the save and come back to the board with a reason. Nothing is
 * written in those cases.
 */
export async function logOutcome(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const outcome = String(formData.get("outcome") ?? "").trim();

  if (id.length === 0) {
    redirect(backToBoard("No row was identified, so nothing was saved."));
  }

  // Object.hasOwn, not `in`: `in` walks the prototype chain, so values such
  // as "constructor" or "__proto__" would pass as if they were outcomes.
  if (!Object.hasOwn(OUTCOME_LABEL, outcome)) {
    redirect(
      backToBoard(
        `"${outcome || "(blank)"}" is not an outcome this board records, so nothing was saved.`,
      ),
    );
  }

  const config = readSupabaseConfig();
  if (config.kind === "missing") {
    redirect(
      backToBoard(
        `Nothing was saved: ${config.settings.join(", ")} is not set.`,
      ),
    );
  }

  const key = outcome as OutcomeKey;
  const status = key === "signed_off" ? "signed_off" : "reminder_sent";

  let failure: string | null = null;
  let updated: Array<{ id: string }> | null = null;

  try {
    const { data, error } = await getSupabase(config.url, config.key)
      .from("chase_items")
      .update({
        status,
        last_outcome: OUTCOME_LABEL[key],
        last_action_at: new Date().toISOString(),
      })
      .eq("id", id)
      // Never touch a row that is already closed: without this, a stale tab
      // posting "reminder_sent" would reopen a signed-off row onto the board.
      .neq("status", "signed_off")
      .select("id");

    if (error) {
      failure = `Supabase refused the update: ${error.message}`;
    } else {
      updated = (data ?? []) as Array<{ id: string }>;
    }
  } catch (error) {
    failure = `Could not reach Supabase: ${describeError(error)}`;
  }

  if (failure) {
    redirect(backToBoard(failure));
  }

  if (!updated || updated.length === 0) {
    redirect(
      backToBoard(
        "That row is no longer open on the board, so nothing was saved. Reload to see the current list.",
      ),
    );
  }

  revalidatePath("/");
}
