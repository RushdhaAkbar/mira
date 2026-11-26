import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getTesterName, logEvent, registerTester } from "@/lib/tester";

export const dynamic = "force-dynamic";

/**
 * Admin only: attach a name to a tester record. Used for the version without AI,
 * where nobody is asked for a name in the app, so the admin adds it from their own list.
 */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = (await req.json().catch(() => null)) as { testerId?: unknown; name?: unknown; variant?: unknown } | null;
  const testerId = typeof b?.testerId === "string" ? b.testerId : "";
  const name = typeof b?.name === "string" ? b.name.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  if (!/^[0-9a-f-]{36}$/.test(testerId)) return NextResponse.json({ error: "Invalid tester" }, { status: 400 });
  if (name.length < 2) return NextResponse.json({ error: "Please enter a name." }, { status: 400 });
  const variant = b?.variant === "standard" ? "standard" : "ai";

  try {
    const before = await getTesterName(testerId);
    await registerTester(testerId, { name, variant, userAgent: "", source: "admin" });
    await logEvent(testerId, "registered", `${name} (added by admin${before && before !== name ? `, was ${before}` : ""})`, { variant });
  } catch (err) {
    console.error("[admin] set name failed", err);
    return NextResponse.json({ error: "Could not save the name." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, name });
}
