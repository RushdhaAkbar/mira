"use client";

import Image from "next/image";
import Link from "next/link";
import { ComingSoon } from "@/components/ComingSoon";
import { ArrowIcon, ShieldIcon, SparkIcon } from "@/components/Icons";
import { HowItWorks, Trending } from "@/components/Landing";
import { Section } from "@/components/ui";
import { useEnterVariant, useStore } from "@/lib/store";

/** Main landing: the AI version of Mira. (The version without AI lives at /standard.) */
export default function HomePage() {
  useEnterVariant("ai");
  const { quota } = useStore();

  return (
    <div className="fade-up">
      <section className="px-5 pt-5 pb-6 md:grid md:grid-cols-[1.1fr_1fr] md:items-center md:gap-12 md:px-0 md:pt-14 md:pb-14">
        <div>
          <div className="label mb-2">AI virtual fitting room</div>
          <h1 className="display text-[2.2rem] leading-[1.08] text-ink md:text-[3.6rem]">
            See it on <i>you</i>,<br />
            before you buy it.
          </h1>
          <p className="mt-3 max-w-[38ch] text-[0.88rem] text-ink-soft md:mt-5 md:text-[1.02rem]">
            Upload one photo and Mira&apos;s AI dresses you in the garment, then tells you honestly how it fits and which size
            to buy. It takes about 3 minutes.
          </p>
          <div className="mt-5 flex flex-col gap-3 md:mt-7 md:max-w-sm">
            <Link href="/shop" className="btn btn-primary">
              Start my AI try-on <ArrowIcon width={16} height={16} />
            </Link>
            <p className="flex items-center gap-1.5 text-[0.72rem] text-ink-soft">
              <SparkIcon width={14} height={14} className="text-accent" />
              {quota && quota.remaining === 0
                ? "You've used your AI try-on for this testing phase."
                : "During testing, everyone gets one AI try-on."}
            </p>
            <p className="flex items-center gap-1.5 text-[0.72rem] text-ink-soft">
              <ShieldIcon width={14} height={14} /> Photos are deleted automatically after 24 hours.
            </p>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 md:mt-0 md:gap-4">
          {[
            { src: "/hero/before.jpg", label: "Your photo" },
            { src: "/hero/after.jpg", label: "AI try-on" },
          ].map((img, i) => (
            <figure key={img.src} className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-line bg-chip">
              <Image
                src={img.src}
                alt={i === 0 ? "Example photo of a shopper" : "The same shopper wearing a denim jacket, rendered by Mira's AI"}
                fill
                sizes="(max-width: 768px) 45vw, 260px"
                loading="eager"
                fetchPriority="high"
                className="object-cover"
              />
              <figcaption
                className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider ${
                  i === 1 ? "bg-accent text-white" : "bg-panel/90 text-ink-soft"
                }`}
              >
                {img.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <Trending ctaHref="/shop" />
      <HowItWorks steps={["Pick a look", "Add sizes", "Add a photo", "See & rate it"]} />
      <Section>
        <ComingSoon />
      </Section>
    </div>
  );
}
