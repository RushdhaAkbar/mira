"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowIcon, CameraIcon, CheckIcon, ShieldIcon } from "@/components/Icons";
import { PageHeader, ProgressSteps, Section, Split, StickyCta, useVariantGuard } from "@/components/ui";
import { TRYON_RESET, useStore } from "@/lib/store";

const MAX_SIDE = 1024;

/** Resize the chosen file client-side so uploads stay small and fast. */
async function toDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

export default function UploadPage() {
  const router = useRouter();
  // Photo try-on is part of the AI version only.
  const variant = useVariantGuard(["ai"], "/profile");
  const { state, set } = useStore();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isAi = variant === "ai";

  const onFile = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    setBusy("Preparing photo");
    try {
      const dataUrl = await toDataUrl(file);
      set({ photoPreview: dataUrl, photoId: null, photoCheck: null, ...TRYON_RESET });

      if (!isAi) {
        // Standard version: no upload and no AI. The photo stays on the device.
        set({ photoCheck: { ok: true, message: "Photo added. It stays on your device in this version.", issues: [] } });
        return;
      }

      setBusy("Uploading securely");
      const up = await fetch("/api/photos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      if (!up.ok) {
        const err = (await up.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error || `Upload failed (${up.status})`);
      }
      const { id } = (await up.json()) as { id: string };

      setBusy("AI is checking pose and lighting");
      const chk = await fetch("/api/analyze-photo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ photoId: id }),
      });
      const check = (await chk.json()) as { ok: boolean; message: string; issues: string[] };
      set({ photoId: id, photoCheck: check });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const removePhoto = async () => {
    if (state.photoId) fetch(`/api/photos/${state.photoId}`, { method: "DELETE" }).catch(() => {});
    set({ photoId: null, photoPreview: null, photoCheck: null, ...TRYON_RESET });
  };

  const ready = isAi ? Boolean(state.photoId && state.photoCheck?.ok) : Boolean(state.photoPreview);

  return (
    <div>
      <ProgressSteps step={2} />
      <PageHeader eyebrow="Step 2 of 4" title="Add your photo" subtitle="One full-body photo, facing the camera, in good light." />
      <Split
        left={
          <>
            <Section>
              <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl border border-dashed border-line bg-chip">
                {state.photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={state.photoPreview} alt="Your photo" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
                    <svg
                      viewBox="0 0 120 240"
                      className="h-40 text-ink-soft/50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <circle cx="60" cy="28" r="18" />
                      <path d="M60 46v70M30 70l30-18 30 18M30 70v40M90 70v40M60 116l-18 100M60 116l18 100" strokeLinecap="round" />
                    </svg>
                    <p className="text-[0.76rem] text-ink-soft">Stand inside the guide, arms slightly away from your body.</p>
                  </div>
                )}
                {busy && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-panel/80 backdrop-blur-sm">
                    <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
                    <span className="text-[0.74rem] font-semibold text-ink">{busy}…</span>
                  </div>
                )}
              </div>
            </Section>
          </>
        }
        right={
          <>
            <Section>
              <div className="flex gap-2">
                <button type="button" className="btn btn-primary" onClick={() => cameraRef.current?.click()} disabled={Boolean(busy)}>
                  <CameraIcon width={16} height={16} /> Take photo
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => galleryRef.current?.click()} disabled={Boolean(busy)}>
                  Choose from gallery
                </button>
              </div>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <input ref={galleryRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
              {state.photoPreview && !busy && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="mt-2 w-full text-center text-[0.72rem] font-semibold text-ink-soft underline-offset-2 hover:underline"
                >
                  Remove photo
                </button>
              )}
            </Section>

            {error && (
              <Section>
                <div className="rounded-xl border border-poor/40 bg-poor/10 px-4 py-3 text-[0.78rem] text-poor">{error}</div>
              </Section>
            )}

            {state.photoCheck && (
              <Section>
                <div className={`card flex items-start gap-3 p-4 fade-up ${state.photoCheck.ok ? "border-good/50" : "border-warn/60"}`}>
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${state.photoCheck.ok ? "bg-good" : "bg-warn"} text-white`}
                  >
                    <CheckIcon width={14} height={14} />
                  </span>
                  <div>
                    <b className="block text-[0.82rem] text-ink">
                      {!state.photoCheck.ok ? "Let's retake that one" : isAi ? "Body detected" : "Photo ready"}
                    </b>
                    <p className="text-[0.74rem] text-ink-soft">{state.photoCheck.message}</p>
                    {state.photoCheck.issues.length > 0 && (
                      <ul className="mt-1 list-disc pl-4 text-[0.72rem] text-ink-soft">
                        {state.photoCheck.issues.map((i) => (
                          <li key={i}>{i}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </Section>
            )}

            <Section title="Photo tips">
              <ul className="grid grid-cols-2 gap-2 text-[0.72rem] text-ink-soft">
                {[
                  "Plain background, good lighting",
                  "Full body, head to feet",
                  "Fitted clothes show shape best",
                  "Phone at chest height",
                ].map((t) => (
                  <li key={t} className="card px-3 py-2">
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center gap-1.5 text-[0.7rem] text-ink-soft">
                <ShieldIcon width={14} height={14} />
                {isAi ? "Your photo is processed securely and deleted after 24 h." : "Your photo is not uploaded in this version."}
              </div>
            </Section>

            <StickyCta>
              <button type="button" className="btn btn-primary" disabled={!ready || Boolean(busy)} onClick={() => router.push("/try-on")}>
                Continue to try-on <ArrowIcon width={16} height={16} />
              </button>
            </StickyCta>
          </>
        }
      />
    </div>
  );
}
