"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/Icons";
import { HowItWorks, Trending } from "@/components/Landing";
import { useEnterVariant, useStore } from "@/lib/store";

/**
 * Landing for the version without AI: a conventional online store with a size
 * guide. Deliberately no mention of AI or virtual try-on, so testers in this
 * arm experience a typical shop.
 */
export default function StandardHomePage() {
  useEnterVariant("standard");
  const { products } = useStore();
  const collage = products.slice(0, 4);

  return (
    <div className="fade-up">
      <section className="px-5 pt-5 pb-6 md:grid md:grid-cols-[1.1fr_1fr] md:items-center md:gap-12 md:px-0 md:pt-14 md:pb-14">
        <div>
          <div className="label mb-2">New season essentials</div>
          <h1 className="display text-[2.2rem] leading-[1.08] text-ink md:text-[3.6rem]">
            Find your size
            <br />
            before you buy.
          </h1>
          <p className="mt-3 max-w-[38ch] text-[0.88rem] text-ink-soft md:mt-5 md:text-[1.02rem]">
            Browse the collection, enter five measurements, and get a clear size recommendation for the piece you like. It
            takes about 2 minutes.
          </p>
          <div className="mt-5 md:mt-7 md:max-w-sm">
            <Link href="/shop" className="btn btn-primary">
              Shop the collection <ArrowIcon width={16} height={16} />
            </Link>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 md:mt-0 md:gap-4">
          {collage.map((p, i) => (
            <div key={p.id} className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-line bg-white">
              <Image src={p.image} alt={p.name} fill sizes="(max-width: 768px) 45vw, 260px" loading={i < 2 ? "eager" : "lazy"} className="object-cover" />
            </div>
          ))}
        </div>
      </section>

      <Trending ctaHref="/shop" />
      <HowItWorks steps={["Pick a look", "Enter measurements", "Get your size", "Rate it"]} />
    </div>
  );
}
