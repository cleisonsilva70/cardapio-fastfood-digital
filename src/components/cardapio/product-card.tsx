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
    <article className="group overflow-hidden rounded-[28px] border border-[var(--line)] bg-[rgba(255,248,240,0.88)] shadow-[0_20px_45px_rgba(80,41,21,0.12)] transition-transform duration-300 hover:-translate-y-1">
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

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="text-xl font-black text-[var(--foreground)]">
            {product.name}
          </h3>
          <p className="min-h-14 text-sm leading-6 text-[var(--muted)]">
            {product.description}
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
              A partir de
            </span>
            <p className="text-2xl font-black text-[var(--brand)]">
              {formatCurrency(product.price)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onAdd(product)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-strong)]"
          >
            <ShoppingBag size={16} />
            Adicionar
          </button>
        </div>
      </div>
    </article>
  );
}
