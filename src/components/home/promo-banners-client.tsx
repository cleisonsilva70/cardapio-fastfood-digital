"use client";

import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { isInlineImage } from "@/lib/image-reference";
import { isHttpUrl } from "@/lib/links";
import type { Product, PromoBanner } from "@/lib/types";
import { useCartStore } from "@/store/cart-store";

type PromoBannersClientProps = {
  banners: PromoBanner[];
  products: Product[];
};

export function PromoBannersClient({ banners, products }: PromoBannersClientProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [feedbackId, setFeedbackId] = useState("");

  function handleAddToCart(banner: PromoBanner) {
    const product = products.find((item) => item.id === banner.ctaProductId);

    if (!product) {
      return;
    }

    addItem(product);
    setFeedbackId(banner.id);

    window.setTimeout(() => {
      setFeedbackId((current) => (current === banner.id ? "" : current));
    }, 1800);
  }

  return (
    <section className="container-shell mt-10">
      <div className="grid gap-6 lg:grid-cols-2">
        {banners.map((banner) => (
          <article
            key={banner.id}
            className="panel-card group overflow-hidden border border-[var(--line)]"
          >
            <div className="relative h-56">
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized={isInlineImage(banner.imageUrl)}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(20,11,7,0.85)] via-[rgba(20,11,7,0.46)] to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                  Banner promocional
                </p>
                <h3 className="mt-3 max-w-xl text-3xl font-black uppercase leading-[0.95]">
                  {banner.title}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/85">
                  {banner.description}
                </p>
                {banner.ctaMode === "ADD_TO_CART" ? (
                  <button
                    type="button"
                    onClick={() => handleAddToCart(banner)}
                    className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--foreground)] shadow-[0_16px_34px_rgba(0,0,0,0.18)] transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    {feedbackId === banner.id ? <CheckCircle2 size={16} /> : <ShoppingBag size={16} />}
                    {feedbackId === banner.id ? "Adicionado" : banner.ctaLabel}
                  </button>
                ) : isHttpUrl(banner.ctaHref ?? "#cardapio") ? (
                  <a
                    href={banner.ctaHref ?? "#cardapio"}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex w-fit rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--foreground)] shadow-[0_16px_34px_rgba(0,0,0,0.18)] transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    {banner.ctaLabel}
                  </a>
                ) : (
                  <Link
                    href={banner.ctaHref ?? "#cardapio"}
                    className="mt-5 inline-flex w-fit rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--foreground)] shadow-[0_16px_34px_rgba(0,0,0,0.18)] transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    {banner.ctaLabel}
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
