import { NextResponse } from "next/server";
import { getFeedbackRows, isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const COLUMNS = [
  "createdAt", "variant", "overall", "realism", "fitConfidence", "easeOfUse", "purchaseIntent", "photoComfort",
  "recommend", "liked", "improve", "ageRange", "gender", "shopsOnline", "email", "productName", "colorName",
  "triedSize", "recommendedSize", "aiRendered", "device",
] as const;

const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV export of all feedback, for SPSS / Excel analysis. Admin only. */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await getFeedbackRows();
  const csv = [COLUMNS.join(","), ...rows.map((r) => COLUMNS.map((c) => csvCell(r[c])).join(","))].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse("﻿" + csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="mira-feedback-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}
