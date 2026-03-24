"use client";

import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types";

type ProductCardProps = {
  product: Product;
  onAdd: (product: Product) => void;
};

export function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-[30px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,250,243,0.96),rgba(255,243,230,0.92))] shadow-[0_24px_52px_rgba(80,41,21,0.12)] transition-transform duration-300 hover:-translate-y-1.5">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[color-mix(in_srgb,var(--accent)_26%,transparent)] blur-3xl" />
      <div className="relative h-48 overflow-hidden sm:h-52">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {product.featured ? (
          <span className="absolute left-4 top-4 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[var(--foreground)]">
            Mais pedido
          </span>
        ) : null}
      </div>

      <div className="relative z-10 space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-[-0.03em] text-[var(--foreground)]">
            {product.name}
          </h3>
          <p className="min-h-14 text-sm leading-6 text-[var(--muted)]">
            {product.description}
          </p>
        </div>

        <div className="flex flex-col gap-4 border-t border-[rgba(70,37,17,0.08)] pt-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                Valor
              </span>
              <p className="text-2xl font-black text-[var(--brand)]">
                {formatCurrency(product.price)}
              </p>
            </div>

            <span className="rounded-full bg-[rgba(255,191,71,0.18)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">
              Pedido rapido
            </span>
          </div>

          <button
            type="button"
            onClick={() => onAdd(product)}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_16px_26px_rgba(145,47,18,0.2)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            <ShoppingBag size={16} />
            Adicionar ao pedido
          </button>
        </div>
      </div>
    </article>
  );
}
