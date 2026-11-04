import type { Metadata } from "next";
import { AdminLogin, LogoutButton } from "./AdminClient";
import { adminConfigured, EVENT_LABELS, getTesterRows, getUsage, isAdmin, type TesterRow } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="label">{label}</div>
      <div className="display mt-1 text-[1.7rem] text-ink">{value}</div>
      {sub && <div className="text-[0.72rem] text-ink-soft">{sub}</div>}
    </div>
  );
}

const EVENT_PILL: Record<string, string> = {
  registered: "",
  photo_uploaded: "",
  ai_tryon: "good",
  ai_tryon_failed: "poor",
  fit_result: "",
  demo_order: "warn",
};

function Testers({ rows }: { rows: TesterRow[] }) {
  if (!rows.length) return <div className="card px-4 py-10 text-center text-[0.84rem] text-ink-soft">No one has started a try-on yet.</div>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[900px] text-[0.76rem]">
        <thead>
          <tr className="border-b border-line text-left text-ink-soft">
            {["Name", "Version", "Started", "Last seen", "Device", "AI try-ons", "What they did"].map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line align-top last:border-0">
              <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-ink">{r.name}</td>
              <td className="px-3 py-2.5">
                <span className={`pill ${r.variant === "ai" ? "good" : "warn"}`}>{r.variant === "ai" ? "AI" : "Standard"}</span>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-ink-soft">{when(r.registeredAt)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-ink-soft">{when(r.lastSeenAt)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-ink-soft">{r.device}</td>
              <td className="px-3 py-2.5 tabular-nums text-ink">{r.aiUsed}</td>
              <td className="px-3 py-2.5">
                {r.events.length === 0 ? (
                  <span className="text-ink-soft">Gave name only</span>
                ) : (
                  <ol className="flex flex-col gap-1">
                    {r.events.map((e, i) => (
                      <li key={i} className="flex flex-wrap items-baseline gap-x-2">
                        <span className="tabular-nums text-ink-soft">{time(e.at)}</span>
                        <span className={`pill ${EVENT_PILL[e.type] ?? ""}`}>{EVENT_LABELS[e.type] ?? e.type}</span>
                        {e.detail && <span className="text-ink-soft">{e.detail}</span>}
                      </li>
                    ))}
                  </ol>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return <AdminLogin configured={adminConfigured()} />;
  }

  const [rows, usage] = await Promise.all([getTesterRows(), getUsage()]);
  const withTryOn = rows.filter((r) => r.events.some((e) => e.type === "ai_tryon")).length;

  return (
    <div className="min-h-dvh bg-ground px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="brand text-[0.85rem] text-ink">Mira</div>
            <h1 className="display text-[2rem] text-ink">Testing access log</h1>
            <p className="text-[0.84rem] text-ink-soft">Everyone who gave their name to start a try-on, and what they did afterwards.</p>
          </div>
          <div className="flex gap-2">
            <a href="/api/admin/testers" className="btn btn-primary" style={{ width: "auto" }}>
              Download CSV
            </a>
            <LogoutButton />
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Testers" value={usage.testers} sub={`${withTryOn} completed an AI try-on`} />
          <StatCard label="AI try-ons used" value={usage.aiGenerations} sub={`Cap ${usage.totalLimit} · ${usage.perTester} per tester`} />
          <StatCard label="Demo orders" value={usage.demoOrders} sub="Purchase-intent signal" />
          <StatCard label="Est. AI cost" value={`$${(usage.aiGenerations * 0.04).toFixed(2)}`} sub="At about $0.04 per render" />
        </section>

        <h2 className="label mt-8 mb-3">All testers ({rows.length})</h2>
        <Testers rows={rows} />
      </div>
    </div>
  );
}
