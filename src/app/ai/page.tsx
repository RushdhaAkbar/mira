import { redirect } from "next/navigation";

/** The AI version is the main landing page; keep /ai working as an alias. */
export default function AiAlias() {
  redirect("/");
}
