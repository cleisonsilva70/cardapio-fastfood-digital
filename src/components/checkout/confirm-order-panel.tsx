"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, QrCode } from "lucide-react";
import { CHECKOUT_DRAFT_STORAGE_KEY } from "@/lib/checkout-draft";
import { paymentLabels } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
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
    paymentMethod: PaymentMethod;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
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
      name: item.name,
      price: item.price,
      quantity: item.quantity,
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

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl as string;
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
      <section className="panel-card mx-auto max-w-3xl p-8 sm:p-10">
        <p className="text-sm text-[var(--muted)]">Carregando confirmacao do pedido...</p>
      </section>
    );
  }

  if (!draft) {
    return (
      <section className="panel-card mx-auto max-w-3xl p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
          Confirmacao
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase">Pedido nao encontrado</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Volte ao checkout e prepare o pedido novamente antes de confirmar no WhatsApp.
        </p>
        <div className="mt-8">
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white/70 px-6 py-4 text-sm font-bold uppercase tracking-[0.16em]"
          >
            Voltar ao checkout
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="panel-card mx-auto max-w-4xl p-8 sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
        Confirmacao final
      </p>
      <h1 className="mt-3 text-4xl font-black uppercase">
        Confirmar e seguir para o pagamento
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">
        O pedido sera criado com pagamento pendente. Ele so entra na cozinha
        depois que o pagamento for confirmado e o WhatsApp for aberto.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-[var(--line)] bg-white/75 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-strong)]">
            Cliente e entrega
          </p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
            <p><strong className="text-[var(--foreground)]">Cliente:</strong> {draft.checkout.customerName}</p>
            <p><strong className="text-[var(--foreground)]">Telefone:</strong> {draft.checkout.phone}</p>
            <p><strong className="text-[var(--foreground)]">Endereco:</strong> {draft.checkout.address}, {draft.checkout.houseNumber}</p>
            {draft.checkout.deliveryArea ? (
              <p><strong className="text-[var(--foreground)]">Bairro:</strong> {draft.checkout.deliveryArea}</p>
            ) : null}
            {draft.checkout.reference ? (
              <p><strong className="text-[var(--foreground)]">Referencia:</strong> {draft.checkout.reference}</p>
            ) : null}
            <p><strong className="text-[var(--foreground)]">Pagamento:</strong> {paymentLabels[draft.checkout.paymentMethod]}</p>
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--foreground)] p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Resumo
          </p>
          <div className="mt-4 space-y-3">
            {summaryItems.map((item) => (
              <div key={item.id} className="rounded-[20px] bg-white/8 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="mt-1 text-sm text-white/70">
                      {item.quantity}x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <strong>{formatCurrency(item.subtotal)}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-sm text-white/70">Subtotal dos itens</span>
            <strong className="text-xl">{formatCurrency(subtotal)}</strong>
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
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:bg-[rgba(184,68,31,0.45)]"
        >
          {draft.checkout.paymentMethod === "PIX" ? (
            <QrCode size={18} />
          ) : (
            <CreditCard size={18} />
          )}
          {isSubmitting ? "Preparando pagamento..." : "Confirmar e ir para pagamento"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/checkout")}
          className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white/70 px-6 py-4 text-sm font-bold uppercase tracking-[0.16em]"
        >
          Voltar e revisar
        </button>
      </div>
    </section>
  );
}
