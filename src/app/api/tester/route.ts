import { NextResponse } from "next/server";
import { imageGenEnabled } from "@/lib/ai/nanobanana";
import { getQuota, getTesterId } from "@/lib/tester";

export const dynamic = "force-dynamic";

/** Creates the anonymous tester cookie if needed and reports the AI try-on allowance. */
export async function GET() {
  const testerId = await getTesterId();
  try {
    const quota = await getQuota(testerId);
    return NextResponse.json({ quota, aiAvailable: imageGenEnabled() });
  } catch (err) {
    console.error("[tester] quota lookup failed", err);
    return NextResponse.json({ quota: null, aiAvailable: imageGenEnabled() });
  }
}
