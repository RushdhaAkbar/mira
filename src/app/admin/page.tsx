import type { Metadata } from "next";
import { AdminLogin, LogoutButton, TesterTabs } from "./AdminClient";
import { adminConfigured, getTesterRows, getUsage, isAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="label">{label}</div>
      <div className="display mt-1 text-[1.7rem] text-ink">{value}</div>
      {sub && <div className="text-[0.72rem] text-ink-soft">{sub}</div>}
    </div>
  );
}

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return <AdminLogin configured={adminConfigured()} />;
  }

  const [rows, usage] = await Promise.all([getTesterRows(), getUsage()]);
  const ai = rows.filter((r) => r.variant === "ai");
  const standard = rows.filter((r) => r.variant === "standard");
  const withTryOn = ai.filter((r) => r.events.some((e) => e.type === "ai_tryon")).length;
  const unnamed = rows.filter((r) => !r.name).length;

  return (
    <div className="min-h-dvh bg-ground px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="brand text-[0.85rem] text-ink">Mira</div>
            <h1 className="display text-[2rem] text-ink">Testing access log</h1>
            <p className="text-[0.84rem] text-ink-soft">
              Everyone who used Mira during testing and what they did. AI-version testers give their name in the app; for the version
              without AI, add the name from your records.
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/api/admin/testers" className="btn btn-primary" style={{ width: "auto" }}>
              Download CSV
            </a>
            <LogoutButton />
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="AI version" value={ai.length} sub={`${withTryOn} completed an AI try-on`} />
          <StatCard label="Standard version" value={standard.length} sub={`${unnamed} still need a name`} />
          <StatCard
            label="AI renders used"
            value={usage.aiGenerations}
            sub={`Cap ${usage.totalLimit} · ${usage.perTester} per tester · ≈ $${(usage.aiGenerations * 0.04).toFixed(2)}`}
          />
          <StatCard label="Demo orders" value={usage.demoOrders} sub="Purchase-intent signal" />
        </section>

        <TesterTabs ai={ai} standard={standard} />
      </div>
    </div>
  );
}
