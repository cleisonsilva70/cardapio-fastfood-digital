"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useCartStore } from "@/store/cart-store";

export function CartPanel() {
  const { items, increaseItem, decreaseItem, removeItem } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const cartContent = useMemo(
    () => (
      <>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
              Carrinho
            </p>
            <h3 className="mt-2 text-2xl font-black">Seu pedido</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,rgba(35,21,15,0.96),rgba(57,31,21,0.92))] text-white shadow-[0_18px_36px_rgba(35,21,15,0.18)]">
            <ShoppingBag size={20} />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="panel-subtle mt-6 border-dashed p-5 text-sm leading-6 text-[var(--muted)]">
            Escolha seus burgers, combos e bebidas para montar o pedido.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="panel-subtle p-4">
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
                  <div className="glass-pill inline-flex items-center gap-2 rounded-full px-2 py-2">
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

        <div className="mt-6 rounded-[24px] bg-[linear-gradient(180deg,rgba(35,21,15,0.98),rgba(57,31,21,0.92))] p-5 text-white shadow-[0_22px_50px_rgba(35,21,15,0.22)]">
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
            onClick={() => setIsOpen(false)}
            className={`mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full px-4 py-3 text-center text-sm font-bold transition-colors ${
              items.length === 0
                ? "pointer-events-none bg-white/15 text-white/55"
                : "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[#ffd372]"
            }`}
          >
            Continuar para entrega
          </Link>
        </div>
      </>
    ),
    [decreaseItem, increaseItem, itemCount, items, removeItem, setIsOpen, total],
  );

  return (
    <>
      <aside className="hidden panel-card p-5 xl:sticky xl:top-6 xl:block">
        {cartContent}
      </aside>

      <div className="xl:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed inset-x-4 bottom-4 z-40 flex min-h-14 items-center justify-between rounded-[24px] bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] px-5 py-4 text-left text-white shadow-[0_20px_36px_rgba(145,47,18,0.3)]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12">
              <ShoppingBag size={18} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                Seu carrinho
              </p>
              <p className="text-sm font-bold">
                {itemCount > 0 ? `${itemCount} item(ns)` : "Nenhum item ainda"}
              </p>
            </div>
          </div>
          <strong className="text-lg">{formatCurrency(total)}</strong>
        </button>

        {isOpen ? (
          <div className="fixed inset-0 z-50 bg-[rgba(17,10,7,0.45)] backdrop-blur-[2px]">
            <button
              type="button"
              aria-label="Fechar carrinho"
              className="absolute inset-0"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute inset-x-0 bottom-0 max-h-[88vh] rounded-t-[32px] bg-[var(--surface)] px-4 pb-6 pt-4 shadow-[0_-24px_50px_rgba(34,19,13,0.24)]">
              <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-[rgba(34,19,13,0.16)]" />
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
                    Seu pedido
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Revise os itens antes de continuar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--foreground)] shadow-[0_10px_22px_rgba(55,26,12,0.1)]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[calc(88vh-92px)] overflow-y-auto pr-1">
                <div className="panel-card p-5">{cartContent}</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
