import type { Metadata } from "next";
import { AdminLogin, LogoutButton } from "./AdminClient";
import {
  adminConfigured,
  getFeedbackRows,
  getUsage,
  isAdmin,
  RATING_KEYS,
  RATING_LABELS,
  statsFor,
  type FeedbackRow,
  type VariantStats,
} from "@/lib/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const fmt = (n: number | null) => (n === null ? "–" : n.toFixed(2));

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="label">{label}</div>
      <div className="display mt-1 text-[1.7rem] text-ink">{value}</div>
      {sub && <div className="text-[0.72rem] text-ink-soft">{sub}</div>}
    </div>
  );
}

function Comparison({ ai, standard }: { ai: VariantStats; standard: VariantStats }) {
  const rows = [
    ...RATING_KEYS.map((k) => ({ label: `${RATING_LABELS[k]} (1-5)`, a: ai.averages[k], s: standard.averages[k], max: 5 })),
  ];
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[520px] text-[0.8rem]">
        <thead>
          <tr className="border-b border-line text-left text-ink-soft">
            <th className="px-4 py-2.5 font-semibold">Measure</th>
            <th className="px-4 py-2.5 font-semibold">AI version (n={ai.count})</th>
            <th className="px-4 py-2.5 font-semibold">Standard (n={standard.count})</th>
            <th className="px-4 py-2.5 font-semibold">Difference</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const diff = r.a !== null && r.s !== null ? r.a - r.s : null;
            return (
              <tr key={r.label} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 text-ink">{r.label}</td>
                {[r.a, r.s].map((v, i) => (
                  <td key={i} className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-10 tabular-nums text-ink">{fmt(v)}</span>
                      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                        <span
                          className={`block h-full rounded-full ${i === 0 ? "bg-accent" : "bg-ink-soft"}`}
                          style={{ width: `${v === null ? 0 : (v / r.max) * 100}%` }}
                        />
                      </span>
                    </div>
                  </td>
                ))}
                <td className={`px-4 py-2.5 tabular-nums ${diff === null ? "text-ink-soft" : diff >= 0 ? "text-good" : "text-poor"}`}>
                  {diff === null ? "–" : `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}`}
                </td>
              </tr>
            );
          })}
          <tr>
            <td className="px-4 py-2.5 text-ink">Net Promoter Score (-100 to 100)</td>
            <td className="px-4 py-2.5 tabular-nums text-ink">{ai.nps ?? "–"}</td>
            <td className="px-4 py-2.5 tabular-nums text-ink">{standard.nps ?? "–"}</td>
            <td className="px-4 py-2.5 tabular-nums text-ink-soft">
              {ai.nps !== null && standard.nps !== null ? `${ai.nps - standard.nps >= 0 ? "+" : ""}${ai.nps - standard.nps}` : "–"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Responses({ rows }: { rows: FeedbackRow[] }) {
  if (!rows.length) return <div className="card px-4 py-10 text-center text-[0.84rem] text-ink-soft">No feedback yet.</div>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[980px] text-[0.76rem]">
        <thead>
          <tr className="border-b border-line text-left text-ink-soft">
            {["When", "Version", "Overall", "Real", "Fit", "Ease", "Buy", "Photo", "NPS", "Garment", "Liked", "Improve", "About"].map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line align-top last:border-0">
              <td className="whitespace-nowrap px-3 py-2.5 text-ink-soft">
                {new Date(r.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
              </td>
              <td className="px-3 py-2.5">
                <span className={`pill ${r.variant === "ai" ? "good" : "warn"}`}>{r.variant === "ai" ? "AI" : "Standard"}</span>
              </td>
              {[r.overall, r.realism, r.fitConfidence, r.easeOfUse, r.purchaseIntent, r.photoComfort, r.recommend].map((v, i) => (
                <td key={i} className="px-3 py-2.5 tabular-nums text-ink">
                  {v ?? <span className="text-ink-soft">–</span>}
                </td>
              ))}
              <td className="px-3 py-2.5 text-ink">
                {r.productName}
                <div className="text-ink-soft">
                  {r.colorName} · tried {r.triedSize}
                  {r.recommendedSize ? ` · rec ${r.recommendedSize}` : ""}
                  {r.aiRendered ? " · AI render" : ""}
                </div>
              </td>
              <td className="max-w-[220px] px-3 py-2.5 text-ink">{r.liked || <span className="text-ink-soft">–</span>}</td>
              <td className="max-w-[220px] px-3 py-2.5 text-ink">{r.improve || <span className="text-ink-soft">–</span>}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-ink-soft">
                {[r.ageRange, r.gender, r.shopsOnline, r.device].filter(Boolean).join(" · ")}
                {r.email && <div className="text-ink">{r.email}</div>}
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

  const [rows, usage] = await Promise.all([getFeedbackRows(), getUsage()]);
  const ai = statsFor(rows.filter((r) => r.variant === "ai"));
  const standard = statsFor(rows.filter((r) => r.variant === "standard"));

  return (
    <div className="min-h-dvh bg-ground px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="brand text-[0.85rem] text-ink">Mira</div>
            <h1 className="display text-[2rem] text-ink">Testing feedback</h1>
            <p className="text-[0.84rem] text-ink-soft">Responses from the user-testing phase, AI version compared with the standard version.</p>
          </div>
          <div className="flex gap-2">
            <a href="/api/admin/feedback" className="btn btn-primary" style={{ width: "auto" }}>
              Download CSV
            </a>
            <LogoutButton />
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard label="Responses" value={rows.length} sub={`${ai.count} AI · ${standard.count} standard`} />
          <StatCard label="Testers" value={usage.testers} sub="Unique browsers with an AI attempt" />
          <StatCard label="AI try-ons used" value={usage.aiGenerations} sub={`Cap ${usage.totalLimit} · ${usage.perTester} per tester`} />
          <StatCard label="Demo orders" value={usage.demoOrders} sub="Purchase-intent signal" />
          <StatCard label="Est. AI cost" value={`$${(usage.aiGenerations * 0.04).toFixed(2)}`} sub="At about $0.04 per render" />
        </section>

        <h2 className="label mt-8 mb-3">Average ratings by version</h2>
        <Comparison ai={ai} standard={standard} />

        <h2 className="label mt-8 mb-3">All responses ({rows.length})</h2>
        <Responses rows={rows} />
      </div>
    </div>
  );
}
