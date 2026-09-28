"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
        <p className="mt-1 text-[0.8rem] text-ink-soft">View feedback from the testing phase.</p>
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
