import { logOutcome } from "./actions";
import {
  describeError,
  getSupabase,
  readSupabaseConfig,
  SUPABASE_KEY_VAR,
  SUPABASE_URL_VAR,
} from "./lib/supabase";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const REASON_LABEL = {
  feedback_not_collected: "Feedback not collected",
  trainer_report_pending: "Trainer report pending",
  client_sign_off_waiting: "Client sign off waiting",
  invoice_unpaid: "Invoice unpaid",
} as const;

type Reason = keyof typeof REASON_LABEL;

type ChaseRow = {
  id: string;
  client: string;
  batch_code: string;
  reason: Reason;
  amount_paise: number;
  opened_at: string;
  status: "open" | "reminder_sent" | "signed_off";
  last_outcome: string | null;
  last_action_at: string | null;
};

type Board =
  | { kind: "missing"; settings: string[] }
  | { kind: "failed"; message: string; hint: string }
  | { kind: "empty" }
  | { kind: "rows"; rows: ChaseRow[] };

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const DAY_MS = 86_400_000;

function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / DAY_MS));
}

function failureHint(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("does not exist") ||
    lower.includes("relation") ||
    lower.includes("schema cache")
  ) {
    return "The table is not there yet. Run supabase/setup.sql once in the Supabase SQL editor, then reload this page.";
  }
  if (lower.includes("fetch") || lower.includes("network")) {
    return `Check that ${SUPABASE_URL_VAR} points at your project and that this machine can reach it.`;
  }
  if (lower.includes("permission") || lower.includes("row-level")) {
    return "The table exists but the row policies are not in place. Run supabase/setup.sql again.";
  }
  return "Nothing on this page came from a fallback: the board really did fail to load.";
}

async function queryRows(
  url: string,
  key: string,
): Promise<
  { ok: true; rows: ChaseRow[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await getSupabase(url, key)
      .from("chase_items")
      .select(
        "id, client, batch_code, reason, amount_paise, opened_at, status, last_outcome, last_action_at",
      )
      .neq("status", "signed_off")
      .order("amount_paise", { ascending: false })
      .order("opened_at", { ascending: true });

    if (error) {
      const code = error.code ? ` (code ${error.code})` : "";
      return { ok: false, message: `${error.message}${code}` };
    }

    return { ok: true, rows: (data ?? []) as ChaseRow[] };
  } catch (error) {
    return { ok: false, message: describeError(error) };
  }
}

async function loadBoard(): Promise<Board> {
  const config = readSupabaseConfig();
  if (config.kind === "missing") {
    return { kind: "missing", settings: config.settings };
  }

  const result = await queryRows(config.url, config.key);
  if (!result.ok) {
    return {
      kind: "failed",
      message: result.message,
      hint: failureHint(result.message),
    };
  }
  if (result.rows.length === 0) return { kind: "empty" };
  return { kind: "rows", rows: result.rows };
}

export default async function Page(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const rawError = searchParams?.error;
  const banner =
    typeof rawError === "string" && rawError.trim().length > 0
      ? rawError
      : null;

  const board = await loadBoard();

  if (board.kind === "rows") {
    return renderBoard(board.rows, banner);
  }

  return (
    <main className={styles.page}>
      <Masthead />
      {banner ? <p className={styles.banner}>{banner}</p> : null}
      {board.kind === "missing" ? (
        <MissingState settings={board.settings} />
      ) : null}
      {board.kind === "failed" ? (
        <FailedState message={board.message} hint={board.hint} />
      ) : null}
      {board.kind === "empty" ? <EmptyState /> : null}
    </main>
  );
}

function Masthead() {
  return (
    <header className={styles.masthead}>
      <p className={styles.eyebrow}>Training operations</p>
      <h1 className={styles.title}>Chase board</h1>
      <p className={styles.subtitle}>
        Every batch that needs chasing — and what it is worth.
      </p>
    </header>
  );
}

function renderBoard(rows: ChaseRow[], banner: string | null) {
  const totalPaise = rows.reduce((sum, row) => sum + (row.amount_paise ?? 0), 0);
  const clientCount = new Set(rows.map((row) => row.client)).size;
  const oldest = rows.reduce(
    (max, row) => Math.max(max, daysSince(row.opened_at)),
    0,
  );

  const byReason = (Object.keys(REASON_LABEL) as Reason[]).map((reason) => ({
    reason,
    count: rows.filter((row) => row.reason === reason).length,
  }));

  return (
    <main className={styles.page}>
      <Masthead />

      {banner ? <p className={styles.banner}>{banner}</p> : null}

      <section className={styles.summary} aria-label="Board totals">
        <div>
          <p className={styles.summaryLabel}>Rupees at risk</p>
          <p className={styles.total}>{inr.format(totalPaise / 100)}</p>
          <p className={styles.summaryCaption}>
            Counted once per batch, from its unpaid invoice.
          </p>
        </div>
        <dl className={styles.summaryMeta}>
          <div className={styles.metaItem}>
            <dt>Open items</dt>
            <dd>{rows.length}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt>Clients</dt>
            <dd>{clientCount}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt>Oldest waiting</dt>
            <dd>
              {oldest}
              <span className={styles.metaUnit}> days</span>
            </dd>
          </div>
        </dl>
      </section>

      <ul className={styles.reasons} aria-label="Open items by reason">
        {byReason.map(({ reason, count }) => (
          <li
            key={reason}
            className={styles.reasonChip}
            data-empty={count === 0 ? "true" : "false"}
          >
            <span className={styles.reasonDot} data-reason={reason} />
            <span className={styles.reasonName}>{REASON_LABEL[reason]}</span>
            <span className={styles.reasonCount}>{count}</span>
          </li>
        ))}
      </ul>

      <section className={styles.board} aria-label="Batches needing chasing">
        <div className={styles.boardHead} aria-hidden="true">
          <span>Client</span>
          <span>Chasing</span>
          <span>Waiting</span>
          <span className={styles.headRight}>At risk</span>
          <span className={styles.headRight}>Record an outcome</span>
        </div>

        <ul className={styles.boardBody}>
          {rows.map((row) => (
            <li
              key={row.id}
              className={styles.row}
              data-reason={row.reason}
              data-reminded={row.status === "reminder_sent" ? "true" : "false"}
            >
              <div className={styles.cellClient}>
                <span className={styles.client}>{row.client}</span>
                <span className={styles.batchCode}>{row.batch_code}</span>
              </div>

              <div className={styles.cellReason}>
                <span className={styles.badge} data-reason={row.reason}>
                  {REASON_LABEL[row.reason] ?? row.reason}
                </span>
                {row.status === "reminder_sent" && row.last_action_at ? (
                  <span className={styles.remindedNote}>
                    Reminder sent {daysSince(row.last_action_at)}d ago
                  </span>
                ) : null}
              </div>

              <div className={styles.cellWaiting}>
                <span
                  className={styles.days}
                  data-urgent={daysSince(row.opened_at) >= 30 ? "true" : "false"}
                >
                  {daysSince(row.opened_at)}
                </span>
                <span className={styles.daysUnit}>days</span>
              </div>

              <div className={styles.cellAmount}>
                {row.amount_paise > 0 ? (
                  <span className={styles.amount}>
                    {inr.format(row.amount_paise / 100)}
                  </span>
                ) : (
                  <span className={styles.amountNone}>—</span>
                )}
              </div>

              <div className={styles.cellAction}>
                <form action={logOutcome} className={styles.actions}>
                  <input type="hidden" name="id" value={row.id} />
                  <button
                    type="submit"
                    name="outcome"
                    value="reminder_sent"
                    className={styles.btnGhost}
                  >
                    Reminder sent
                  </button>
                  <button
                    type="submit"
                    name="outcome"
                    value="signed_off"
                    className={styles.btnPrimary}
                  >
                    Signed off
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className={styles.footer}>
        Signed-off rows leave the board, and there is no undo yet — re-run the
        seed to bring the demo rows back. Otherwise, logged outcomes and the
        totals update without a reload.
      </p>
    </main>
  );
}

function MissingState({ settings }: { settings: string[] }) {
  const named = settings.length > 0 ? settings.join(" and ") : "a setting";
  return (
    <section className={`${styles.state} ${styles.stateMissing}`}>
      <p className={styles.stateTag}>Setting missing</p>
      <h2 className={styles.stateTitle}>Missing setting: {named}</h2>
      <p className={styles.stateBody}>
        The board never reached Supabase, because it does not have an address or
        a key to reach it with. Create a file named <code>.env.local</code> in
        the <code>chase-board</code> folder, next to <code>package.json</code>,
        holding these two lines:
      </p>
      <pre className={styles.stateCode}>
        {`${SUPABASE_URL_VAR}=https://your-project.supabase.co\n${SUPABASE_KEY_VAR}=your-publishable-key`}
      </pre>
      <p className={styles.stateNote}>
        Only the publishable key goes here. Then restart the dev server — Next.js
        reads <code>.env.local</code> at start-up, not while it is running.
      </p>
    </section>
  );
}

function FailedState({ message, hint }: { message: string; hint: string }) {
  return (
    <section className={`${styles.state} ${styles.stateFailed}`}>
      <p className={styles.stateTag}>Call failed</p>
      <h2 className={styles.stateTitle}>The board could not load</h2>
      <p className={styles.stateBody}>
        The settings are present, but the call to Supabase did not succeed.
        Supabase said:
      </p>
      <pre className={styles.stateCode}>{message}</pre>
      <p className={styles.stateNote}>{hint}</p>
    </section>
  );
}

function EmptyState() {
  return (
    <section className={`${styles.state} ${styles.stateEmpty}`}>
      <p className={styles.stateTag}>No rows</p>
      <h2 className={styles.stateTitle}>The board is empty</h2>
      <p className={styles.stateBody}>
        The settings are right and Supabase answered — so this is not a
        connection problem. The <code>chase_items</code> table simply has no
        open rows in it.
      </p>
      <p className={styles.stateNote}>
        To fill it, run <code>supabase/seed.sql</code> in the Supabase SQL
        editor, then reload. That script adds ten realistic demo items and one
        already signed-off one.
      </p>
    </section>
  );
}
