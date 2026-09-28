import { COMING_SOON } from "@/lib/products";

/** Features promised for the full launch, clearly marked as unavailable during testing. */
export function ComingSoon({ compact }: { compact?: boolean }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="label">Coming at full launch</span>
        <span className="pill warn">Not in this test</span>
      </div>
      <ul className="divide-y divide-line">
        {COMING_SOON.map((f) => (
          <li key={f.title} className="flex items-start gap-3 px-4 py-3 opacity-80">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chip text-[0.7rem]" aria-hidden>
              🔒
            </span>
            <span>
              <b className="block text-[0.8rem] text-ink">{f.title}</b>
              {!compact && <span className="text-[0.72rem] text-ink-soft">{f.body}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
