"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useCartStore } from "@/store/cart-store";

export function CartPanel() {
  const { items, increaseItem, decreaseItem, removeItem } = useCartStore();

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <aside className="panel-card order-first p-5 xl:order-none xl:sticky xl:top-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
            Carrinho
          </p>
          <h3 className="mt-2 text-2xl font-black">Seu pedido</h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--foreground)] text-white">
          <ShoppingBag size={20} />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-[22px] border border-dashed border-[var(--line)] bg-white/55 p-5 text-sm leading-6 text-[var(--muted)]">
          Adicione burgers, combos e bebidas para montar o pedido.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-[22px] border border-[var(--line)] bg-white/75 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold">{item.name}</h4>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {formatCurrency(item.price)} cada
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-[var(--danger)] transition-opacity hover:opacity-75"
                  aria-label={`Remover ${item.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-2">
                  <button
                    type="button"
                    onClick={() => decreaseItem(item.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--foreground)]"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-6 text-center font-bold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => increaseItem(item.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)] text-white"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <strong className="text-lg text-[var(--brand)]">
                  {formatCurrency(item.subtotal)}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-[22px] bg-[var(--foreground)] p-5 text-white">
        <div className="flex items-center justify-between text-sm text-white/75">
          <span>Itens</span>
          <span>{itemCount}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-2xl font-black">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>

        <Link
          href="/checkout"
          className={`mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full px-4 py-3 text-center text-sm font-bold transition-colors ${
            items.length === 0
              ? "pointer-events-none bg-white/15 text-white/55"
              : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[#ffd372]"
          }`}
        >
          Avancar para entrega
        </Link>
      </div>
    </aside>
  );
}
