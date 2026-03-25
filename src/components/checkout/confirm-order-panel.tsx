"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MessageCircleMore } from "lucide-react";
import { CHECKOUT_DRAFT_STORAGE_KEY } from "@/lib/checkout-draft";
import { paymentLabels } from "@/lib/constants";
import { formatCashChangeFor, formatCurrency } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";
import { useCartStore } from "@/store/cart-store";

type DraftPayload = {
  checkout: {
    customerName: string;
    phone: string;
    address: string;
    houseNumber: string;
    deliveryArea?: string;
    reference?: string;
    customerNote?: string;
    cashChangeFor?: string;
    paymentMethod: PaymentMethod;
  };
  items: Array<{
    id: string;
    cartItemId?: string;
    name: string;
    price: number;
    quantity: number;
    selectedSizeId?: string;
    selectedOptionalItemIds?: string[];
    customerNote?: string;
    customizationText?: string;
    subtotal: number;
  }>;
};

export function ConfirmOrderPanel() {
  const router = useRouter();
  const { items: cartItems, clearCart } = useCartStore();
  const [draft, setDraft] = useState<DraftPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const rawDraft = window.sessionStorage.getItem(CHECKOUT_DRAFT_STORAGE_KEY);

    if (!rawDraft) {
      setLoading(false);
      return;
    }

    try {
      setDraft(JSON.parse(rawDraft) as DraftPayload);
    } catch {
      window.sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const summaryItems = useMemo(() => {
    if (draft?.items.length) {
      return draft.items;
    }

    return cartItems.map((item) => ({
      id: item.id,
      cartItemId: item.cartItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      selectedSizeId: item.selectedSizeId,
      selectedOptionalItemIds: item.selectedOptionalItemIds,
      customerNote: item.customerNote,
      customizationText: item.customizationText,
      subtotal: item.subtotal,
    }));
  }, [cartItems, draft]);

  const subtotal = summaryItems.reduce((acc, item) => acc + item.subtotal, 0);

  async function handleConfirm() {
    if (!draft) {
      setError("Nao encontramos os dados do pedido para confirmar.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Nao foi possivel confirmar o pedido.");
        return;
      }

      window.sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
      clearCart();

      if (data.whatsappUrl) {
        window.location.href = data.whatsappUrl as string;
        return;
      }

      router.push(
        `/pedido/${data.order.orderNumberFormatted}?orderId=${encodeURIComponent(data.order.id)}&whatsapp=${encodeURIComponent(data.whatsappUrl)}&paymentMethod=${encodeURIComponent(data.order.paymentMethod)}&paymentCode=${encodeURIComponent(data.order.paymentCode ?? "")}`,
      );
    } catch {
      setError("Falha ao confirmar o pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="panel-card luxury-section mx-auto max-w-3xl p-8 sm:p-10">
        <p className="text-sm text-[var(--muted)]">Carregando a revisao do seu pedido...</p>
      </section>
    );
  }

  if (!draft) {
    return (
      <section className="panel-card luxury-section mx-auto max-w-3xl p-8 sm:p-10">
        <p className="glass-pill inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
          Confirmacao
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase">Pedido nao encontrado</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Volte ao checkout e monte seu pedido novamente antes de enviar para a loja.
        </p>
        <div className="mt-8">
          <Link
            href="/checkout"
            className="glass-pill inline-flex items-center justify-center rounded-full px-6 py-4 text-sm font-bold uppercase tracking-[0.16em]"
          >
            Voltar ao checkout
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="panel-card luxury-section mx-auto max-w-5xl overflow-hidden p-8 sm:p-10">
      <div className="grid gap-6 border-b border-[rgba(70,37,17,0.08)] pb-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <span className="glass-pill inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
            Revisao final
          </span>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-[-0.04em] sm:text-5xl">
            Ultima conferencia antes de enviar
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-[1.02rem]">
            Confira seus dados, os itens e o total. Quando voce confirmar, o
            pedido segue para a loja e entra no atendimento.
          </p>
        </div>

        <div className="rounded-[28px] border border-[rgba(34,19,13,0.08)] bg-[var(--surface-dark)] p-5 text-white shadow-[0_18px_34px_rgba(34,19,13,0.18)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
            O que acontece depois
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              "Cliente confirma",
              "Atendimento recebe",
              "Cozinha prepara",
            ].map((step, index) => (
              <div key={step} className="rounded-[20px] border border-white/10 bg-white/8 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/45">
                  Etapa {index + 1}
                </p>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.04em]">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel-subtle rounded-[30px] p-6 sm:p-7">
          <p className="inline-flex rounded-full bg-[rgba(184,68,31,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-strong)]">
            Cliente e entrega
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["Cliente", draft.checkout.customerName],
              ["Telefone", draft.checkout.phone],
              ["Endereco", `${draft.checkout.address}, ${draft.checkout.houseNumber}`],
              ["Bairro", draft.checkout.deliveryArea ?? "Nao informado"],
              ["Referencia", draft.checkout.reference ?? "Sem referencia"],
              ["Observacao do pedido", draft.checkout.customerNote ?? "Sem observacao"],
              ["Pagamento", paymentLabels[draft.checkout.paymentMethod]],
              [
                "Troco para",
                draft.checkout.paymentMethod === "DINHEIRO"
                  ? formatCashChangeFor(draft.checkout.cashChangeFor) ?? "Sem troco"
                  : "Nao se aplica",
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[22px] border border-[rgba(70,37,17,0.07)] bg-white/75 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
                  {label}
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[var(--foreground)]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-[rgba(34,19,13,0.08)] bg-[linear-gradient(180deg,var(--surface-dark),#1b100b)] p-6 text-white shadow-[0_18px_36px_rgba(34,19,13,0.18)] sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Resumo
          </p>
          <div className="mt-5 space-y-3">
            {summaryItems.map((item) => (
              <div key={item.cartItemId ?? item.id} className="rounded-[22px] border border-white/8 bg-white/7 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold uppercase tracking-[0.02em]">{item.name}</p>
                    <p className="mt-1 text-sm text-white/70">
                      {item.quantity}x {formatCurrency(item.price)}
                    </p>
                    {item.customizationText ? (
                      <p className="mt-2 text-xs leading-5 text-white/70">
                        {item.customizationText}
                      </p>
                    ) : null}
                  </div>
                  <strong>{formatCurrency(item.subtotal)}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[22px] border border-white/8 bg-white/6 p-4">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>Subtotal dos itens</span>
              <span>{summaryItems.length} item(ns)</span>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
                Total confirmado
              </span>
              <strong className="text-2xl">{formatCurrency(subtotal)}</strong>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-6 rounded-2xl border border-[rgba(179,63,47,0.22)] bg-[rgba(179,63,47,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_18px_30px_rgba(145,47,18,0.26)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[rgba(184,68,31,0.45)] disabled:shadow-none"
          >
            <MessageCircleMore size={18} />
            {isSubmitting ? "Enviando pedido..." : "Enviar pedido para a loja"}
          </button>
        <button
          type="button"
          onClick={() => router.push("/checkout")}
          className="glass-pill inline-flex items-center justify-center rounded-full px-6 py-4 text-sm font-bold uppercase tracking-[0.16em]"
        >
          Voltar e ajustar
        </button>
      </div>
    </section>
  );
}
