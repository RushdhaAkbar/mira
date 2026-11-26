import { NextResponse } from "next/server";
import { imageGenEnabled } from "@/lib/ai/nanobanana";
import { getQuota, getTesterId, getTesterName, logEvent, registerTester, touchTester } from "@/lib/tester";
import type { TesterInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Creates the anonymous tester cookie if needed and reports name + AI try-on allowance. */
export async function GET() {
  const testerId = await getTesterId();
  try {
    const [quota, name] = await Promise.all([getQuota(testerId), getTesterName(testerId)]);
    if (name) touchTester(testerId).catch(() => {});
    return NextResponse.json({ name, quota, aiAvailable: imageGenEnabled() } satisfies TesterInfo);
  } catch (err) {
    console.error("[tester] lookup failed", err);
    return NextResponse.json({ name: null, quota: null, aiAvailable: imageGenEnabled() } satisfies TesterInfo);
  }
}

/** Saves the name typed at the gate shown before the AI try-on. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { name?: unknown; variant?: unknown } | null;
  const name = typeof b?.name === "string" ? b.name.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  if (name.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  const variant = b?.variant === "standard" ? "standard" : "ai";
  const userAgent = (req.headers.get("user-agent") ?? "").slice(0, 300);

  const testerId = await getTesterId();
  try {
    const before = await getTesterName(testerId);
    await registerTester(testerId, { name, variant, userAgent });
    await logEvent(testerId, "registered", before && before !== name ? `${name} (was ${before})` : name, { variant, userAgent });
  } catch (err) {
    console.error("[tester] register failed", err);
    return NextResponse.json({ error: "Could not save your name. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, name });
}
