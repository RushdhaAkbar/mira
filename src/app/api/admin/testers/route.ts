import { NextResponse } from "next/server";
import { EVENT_LABELS, getTesterRows, isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const COLUMNS = ["name", "version", "registeredAt", "lastSeenAt", "device", "aiTryOnsUsed", "activity"] as const;

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV export of every named tester and their activity track. Admin only. */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await getTesterRows();
  const lines = rows.map((r) =>
    [
      r.name,
      r.variant,
      r.registeredAt,
      r.lastSeenAt,
      r.device,
      r.aiUsed,
      r.events.map((e) => `${e.at.slice(0, 16).replace("T", " ")} ${EVENT_LABELS[e.type] ?? e.type}${e.detail ? ` (${e.detail})` : ""}`).join(" | "),
    ]
      .map(csvCell)
      .join(","),
  );
  const csv = [COLUMNS.join(","), ...lines].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse("\ufeff" + csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="mira-testers-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}
