"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TesterRow } from "@/lib/admin";
import { EVENT_LABELS } from "@/lib/events";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(((await res.json().catch(() => ({}))) as { error?: string }).error || "Login failed");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ground px-4">
      <form onSubmit={submit} className="card w-full max-w-sm p-6">
        <div className="brand text-[0.85rem] text-ink">Mira</div>
        <h1 className="display mt-1 text-[1.6rem] text-ink">Admin portal</h1>
        <p className="mt-1 text-[0.8rem] text-ink-soft">See who accessed Mira during testing and what they did.</p>
        {!configured ? (
          <p className="mt-4 rounded-lg bg-warn/10 px-3 py-2 text-[0.78rem] text-ink">
            Set <code>ADMIN_PASSWORD</code> in the environment, then restart the app.
          </p>
        ) : (
          <>
            <label className="field mt-5">
              <span className="text-[0.74rem] font-semibold text-ink-soft">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus autoComplete="current-password" />
            </label>
            {error && <p className="mt-2 text-[0.76rem] text-poor">{error}</p>}
            <button type="submit" className="btn btn-primary mt-4" disabled={busy || !password}>
              {busy ? "Checking…" : "Sign in"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

/** Inline box to add or change a tester's name from the admin's own records. */
export function NameEditor({ testerId, variant, name }: { testerId: string; variant: "ai" | "standard"; name: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(!name);
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="font-semibold text-ink">{name}</span>
        <button type="button" className="text-[0.68rem] font-semibold text-ink-soft underline-offset-2 hover:underline" onClick={() => setEditing(true)}>
          Edit
        </button>
      </span>
    );
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/testers/name", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ testerId, name: value, variant }),
    });
    setBusy(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    } else {
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error || "Could not save");
    }
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add name"
          maxLength={80}
          className="h-8 w-36 rounded-md border border-line bg-panel px-2 text-[0.76rem] text-ink"
          autoFocus={Boolean(name)}
        />
        <button type="submit" className="btn btn-primary h-8 px-3 text-[0.72rem]" style={{ width: "auto" }} disabled={busy || value.trim().length < 2}>
          {busy ? "…" : "Save"}
        </button>
        {name && (
          <button type="button" className="text-[0.68rem] text-ink-soft" onClick={() => { setEditing(false); setValue(name); }}>
            Cancel
          </button>
        )}
      </div>
      {error && <span className="text-[0.68rem] text-poor">{error}</span>}
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-ghost"
      style={{ width: "auto" }}
      onClick={async () => {
        await fetch("/api/admin/login", { method: "DELETE" });
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}

/* ---------- tester tables, split into AI / Standard tabs ---------- */

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const EVENT_PILL: Record<string, string> = {
  registered: "",
  photo_uploaded: "",
  ai_tryon: "good",
  ai_tryon_failed: "poor",
  fit_result: "",
  demo_order: "warn",
};

function Testers({ rows, empty, showAi }: { rows: TesterRow[]; empty: string; showAi: boolean }) {
  if (!rows.length) return <div className="card px-4 py-10 text-center text-[0.84rem] text-ink-soft">{empty}</div>;
  const headers = ["Name", "Started", "Last seen", "Device", ...(showAi ? ["AI try-ons"] : []), "What they did"];
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[860px] text-[0.76rem]">
        <thead>
          <tr className="border-b border-line text-left text-ink-soft">
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line align-top last:border-0">
              <td className="whitespace-nowrap px-3 py-2.5">
                <NameEditor testerId={r.id} variant={r.variant} name={r.name} />
                {r.nameSource === "admin" && <div className="text-[0.62rem] text-ink-soft">added by admin</div>}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-ink-soft">{when(r.registeredAt)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-ink-soft">{when(r.lastSeenAt)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-ink-soft">{r.device}</td>
              {showAi && <td className="px-3 py-2.5 tabular-nums text-ink">{r.aiUsed}</td>}
              <td className="px-3 py-2.5">
                {r.events.length === 0 ? (
                  <span className="text-ink-soft">{r.aiUsed > 0 ? "AI try-on (before tracking)" : "Gave name only"}</span>
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

function VariantPanel({ rows, variant }: { rows: TesterRow[]; variant: "ai" | "standard" }) {
  const unnamed = rows.filter((r) => !r.name);
  const named = rows.filter((r) => r.name);
  const isAi = variant === "ai";
  return (
    <>
      {unnamed.length > 0 && (
        <>
          <h2 className="label mt-6 mb-3">Needs a name ({unnamed.length})</h2>
          <p className="mb-3 text-[0.78rem] text-ink-soft">
            {isAi
              ? "These sessions used the AI version before the name popup existed. Add the name if you know it."
              : "Match these sessions to your records by time, device and what they did, then type the name and press Save."}
          </p>
          <Testers rows={unnamed} empty="" showAi={isAi} />
        </>
      )}
      <h2 className="label mt-6 mb-3">Named testers ({named.length})</h2>
      <Testers
        rows={named}
        empty={isAi ? "No one has given a name in the AI version yet." : "No names added for the standard version yet."}
        showAi={isAi}
      />
    </>
  );
}

/** Two tabs, AI version and Standard version, each with its own tester tables. */
export function TesterTabs({ ai, standard }: { ai: TesterRow[]; standard: TesterRow[] }) {
  const [tab, setTab] = useState<"ai" | "standard">("ai");
  const tabs = [
    { key: "ai" as const, label: "AI version", rows: ai },
    { key: "standard" as const, label: "Standard version", rows: standard },
  ];
  return (
    <section className="mt-8">
      <div role="tablist" aria-label="Version" className="inline-flex rounded-full border border-line bg-panel p-1">
        {tabs.map((t) => {
          const active = tab === t.key;
          const pending = t.rows.filter((r) => !r.name).length;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.8rem] font-semibold transition-colors ${
                active ? "bg-ink text-ground" : "text-ink-soft hover:text-ink"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-2 py-0.5 text-[0.66rem] tabular-nums ${active ? "bg-ground/20" : "bg-chip"}`}>{t.rows.length}</span>
              {pending > 0 && !active && <span className="h-2 w-2 rounded-full bg-accent" aria-label={`${pending} need a name`} />}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">
        <VariantPanel rows={tab === "ai" ? ai : standard} variant={tab} />
      </div>
    </section>
  );
}
