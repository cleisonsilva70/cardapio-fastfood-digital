"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CHECKOUT_DRAFT_STORAGE_KEY } from "@/lib/checkout-draft";
import { paymentLabels } from "@/lib/constants";
import { formatDeliveryEstimate } from "@/lib/delivery";
import { formatCashChangeFor, formatCurrency } from "@/lib/format";
import type { DeliveryAreaRule, PaymentMethod } from "@/lib/types";
import { checkoutSchema } from "@/lib/validators";
import { useCartStore } from "@/store/cart-store";

const paymentOptions: PaymentMethod[] = [
  "PIX",
  "DINHEIRO",
  "CARTAO_CREDITO",
  "CARTAO_DEBITO",
];

type CheckoutFormProps = {
  deliveryFee: number;
  estimatedDeliveryMin: number;
  estimatedDeliveryMax: number;
  deliveryAreas: DeliveryAreaRule[];
};

export function CheckoutForm({
  deliveryFee,
  estimatedDeliveryMin,
  estimatedDeliveryMax,
  deliveryAreas,
}: CheckoutFormProps) {
  const router = useRouter();
  const { items } = useCartStore();
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    address: "",
    houseNumber: "",
    deliveryArea: deliveryAreas[0]?.id ?? "",
    reference: "",
    customerNote: "",
    cashChangeFor: "",
    paymentMethod: "PIX" as PaymentMethod,
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const selectedDeliveryArea =
    deliveryAreas.find((area) => area.id === formData.deliveryArea) ?? null;
  const activeDeliveryFee = selectedDeliveryArea?.fee ?? deliveryFee;
  const activeEstimatedDeliveryMin =
    selectedDeliveryArea?.estimatedDeliveryMin ?? estimatedDeliveryMin;
  const activeEstimatedDeliveryMax =
    selectedDeliveryArea?.estimatedDeliveryMax ?? estimatedDeliveryMax;
  const total = subtotal + activeDeliveryFee;

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 2) {
      return digits;
    }

    if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }

    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function updateField<K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K],
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (items.length === 0) {
      setError("Seu carrinho esta vazio.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setFieldErrors({});

    const parsedCheckout = checkoutSchema.safeParse({
      ...formData,
      customerName: formData.customerName.trim(),
      address: formData.address.trim(),
      houseNumber: formData.houseNumber.trim(),
      reference: formData.reference.trim(),
      customerNote: formData.customerNote.trim(),
      cashChangeFor:
        formData.paymentMethod === "DINHEIRO" ? formData.cashChangeFor.trim() : "",
    });

    if (!parsedCheckout.success) {
      const nextErrors: Record<string, string> = {};

      for (const issue of parsedCheckout.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && !nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }

      setFieldErrors(nextErrors);
      setError("Revise os campos destacados antes de enviar.");
      setIsSubmitting(false);
      return;
    }

    try {
      const draftItems = items.map((item) => ({
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

      window.sessionStorage.setItem(
        CHECKOUT_DRAFT_STORAGE_KEY,
        JSON.stringify({
          checkout: parsedCheckout.data,
          items: draftItems,
        }),
      );

      router.push("/pedido/confirmacao");
    } catch {
      setError("Falha ao preparar o pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
      <form onSubmit={handleSubmit} className="panel-card luxury-section p-6 sm:p-8">
        <div className="mb-8">
          <p className="glass-pill inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
            Entrega e contato
          </p>
          <h1 className="mt-4 text-3xl font-black uppercase tracking-[-0.04em]">
            Falta so confirmar sua entrega
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            Preencha seus dados para a loja receber o pedido certinho e agilizar
            seu atendimento.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <p className="glass-pill inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]">
              Taxa {formatCurrency(activeDeliveryFee)}
            </p>
            <p className="glass-pill inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]">
              Prazo{" "}
              {formatDeliveryEstimate(
                activeEstimatedDeliveryMin,
                activeEstimatedDeliveryMax,
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-semibold">Seu nome</span>
            <input
              required
              value={formData.customerName}
              onChange={(event) => updateField("customerName", event.target.value)}
              placeholder="Como a loja deve te chamar"
              className={`w-full rounded-2xl border bg-white/88 px-4 py-3 outline-none transition-colors focus:border-[var(--brand)] ${
                fieldErrors.customerName
                  ? "border-[var(--danger)]"
                  : "border-[var(--line)]"
              }`}
            />
            {fieldErrors.customerName ? (
              <p className="text-sm text-[var(--danger)]">{fieldErrors.customerName}</p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold">WhatsApp para contato</span>
            <input
              required
              inputMode="tel"
              placeholder="(84) 99999-9999"
              value={formData.phone}
              onChange={(event) => updateField("phone", formatPhone(event.target.value))}
              className={`w-full rounded-2xl border bg-white/88 px-4 py-3 outline-none transition-colors focus:border-[var(--brand)] ${
                fieldErrors.phone ? "border-[var(--danger)]" : "border-[var(--line)]"
              }`}
            />
            {fieldErrors.phone ? (
              <p className="text-sm text-[var(--danger)]">{fieldErrors.phone}</p>
            ) : null}
          </label>

          {deliveryAreas.length > 0 ? (
            <label className="space-y-2">
              <span className="text-sm font-semibold">Bairro de entrega</span>
              <select
                required
                value={formData.deliveryArea}
                onChange={(event) => updateField("deliveryArea", event.target.value)}
                className={`w-full rounded-2xl border bg-white/88 px-4 py-3 outline-none transition-colors focus:border-[var(--brand)] ${
                  fieldErrors.deliveryArea
                    ? "border-[var(--danger)]"
                    : "border-[var(--line)]"
                }`}
              >
                <option value="" disabled>
                  Selecione o bairro
                </option>
                {deliveryAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} | {formatCurrency(area.fee)} |{" "}
                    {formatDeliveryEstimate(
                      area.estimatedDeliveryMin,
                      area.estimatedDeliveryMax,
                    )}
                  </option>
                ))}
              </select>
              {fieldErrors.deliveryArea ? (
                <p className="text-sm text-[var(--danger)]">
                  {fieldErrors.deliveryArea}
                </p>
              ) : null}
            </label>
          ) : null}

          <label className="space-y-2">
            <span className="text-sm font-semibold">Como voce vai pagar?</span>
            <select
              value={formData.paymentMethod}
              onChange={(event) =>
                updateField("paymentMethod", event.target.value as PaymentMethod)
              }
              className="w-full rounded-2xl border border-[var(--line)] bg-white/88 px-4 py-3 outline-none transition-colors focus:border-[var(--brand)]"
            >
              {paymentOptions.map((option) => (
                <option key={option} value={option}>
                  {paymentLabels[option]}
                </option>
              ))}
            </select>
          </label>

          {formData.paymentMethod === "DINHEIRO" ? (
            <label className="space-y-2">
              <span className="text-sm font-semibold">Precisa de troco?</span>
              <input
                value={formData.cashChangeFor}
                onChange={(event) => updateField("cashChangeFor", event.target.value)}
                placeholder="Ex.: 50,00"
                className={`w-full rounded-2xl border bg-white/88 px-4 py-3 outline-none transition-colors focus:border-[var(--brand)] ${
                  fieldErrors.cashChangeFor
                    ? "border-[var(--danger)]"
                    : "border-[var(--line)]"
                }`}
              />
              <p className="text-xs leading-5 text-[var(--muted)]">
                Deixe em branco se nao precisar de troco.
              </p>
              {fieldErrors.cashChangeFor ? (
                <p className="text-sm text-[var(--danger)]">
                  {fieldErrors.cashChangeFor}
                </p>
              ) : null}
            </label>
          ) : null}

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-semibold">Rua ou avenida</span>
            <input
              required
              value={formData.address}
              onChange={(event) => updateField("address", event.target.value)}
              placeholder="Ex.: Rua das Flores"
              className={`w-full rounded-2xl border bg-white/88 px-4 py-3 outline-none transition-colors focus:border-[var(--brand)] ${
                fieldErrors.address
                  ? "border-[var(--danger)]"
                  : "border-[var(--line)]"
              }`}
            />
            {fieldErrors.address ? (
              <p className="text-sm text-[var(--danger)]">{fieldErrors.address}</p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold">Numero</span>
            <input
              required
              value={formData.houseNumber}
              onChange={(event) => updateField("houseNumber", event.target.value)}
              placeholder="Ex.: 175"
              className={`w-full rounded-2xl border bg-white/88 px-4 py-3 outline-none transition-colors focus:border-[var(--brand)] ${
                fieldErrors.houseNumber
                  ? "border-[var(--danger)]"
                  : "border-[var(--line)]"
              }`}
            />
            {fieldErrors.houseNumber ? (
              <p className="text-sm text-[var(--danger)]">{fieldErrors.houseNumber}</p>
            ) : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold">Ponto de referencia</span>
            <input
              value={formData.reference}
              onChange={(event) => updateField("reference", event.target.value)}
              placeholder="Ex.: Casa de esquina, portao preto"
              className="w-full rounded-2xl border border-[var(--line)] bg-white/88 px-4 py-3 outline-none transition-colors focus:border-[var(--brand)]"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-semibold">Observacao geral do pedido</span>
            <textarea
              value={formData.customerNote}
              onChange={(event) => updateField("customerNote", event.target.value)}
              rows={3}
              placeholder="Ex.: tocar o interfone, retirar ketchup, mandar troco para R$ 50"
              className="w-full rounded-2xl border border-[var(--line)] bg-white/88 px-4 py-3 outline-none transition-colors focus:border-[var(--brand)]"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-5 rounded-2xl border border-[rgba(179,63,47,0.22)] bg-[rgba(179,63,47,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[var(--muted)]">
            Voce ainda revisa tudo antes de enviar para a loja.
          </p>
          <button
            type="submit"
            disabled={isSubmitting || items.length === 0}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_18px_30px_rgba(145,47,18,0.2)] transition-transform duration-200 hover:-translate-y-0.5 sm:w-auto disabled:cursor-not-allowed disabled:bg-[rgba(184,68,31,0.45)] disabled:shadow-none"
          >
            {isSubmitting ? "Preparando..." : "Continuar para revisar"}
          </button>
        </div>
      </form>

      <aside className="panel-card luxury-section p-6 sm:p-8 xl:sticky xl:top-6">
        <p className="glass-pill inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
          Resumo
        </p>
        <h2 className="mt-4 text-2xl font-black uppercase tracking-[-0.03em]">
          Resumo do pedido
        </h2>
        <div className="mt-5 space-y-4">
          {items.length === 0 ? (
            <div className="panel-subtle border-dashed p-5 text-sm text-[var(--muted)]">
              Seu carrinho esta vazio no momento.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.cartItemId}
                className="panel-subtle p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {item.quantity}x {formatCurrency(item.price)}
                    </p>
                    {item.customizationText ? (
                      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                        {item.customizationText}
                      </p>
                    ) : null}
                  </div>
                  <strong className="text-[var(--brand)]">
                    {formatCurrency(item.subtotal)}
                  </strong>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 rounded-[24px] bg-[linear-gradient(180deg,rgba(35,21,15,0.98),rgba(57,31,21,0.92))] p-5 text-white shadow-[0_22px_50px_rgba(35,21,15,0.22)]">
          <div className="flex justify-between text-sm text-white/70">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="mt-3 flex justify-between text-sm text-white/70">
            <span>Entrega</span>
            <span>{formatCurrency(activeDeliveryFee)}</span>
          </div>
          <div className="mt-3 flex justify-between text-sm text-white/70">
            <span>Previsao</span>
            <span>
              {formatDeliveryEstimate(
                activeEstimatedDeliveryMin,
                activeEstimatedDeliveryMax,
              )}
            </span>
          </div>
          <div className="mt-4 flex justify-between text-2xl font-black">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {formData.paymentMethod === "DINHEIRO" ? (
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Troco: {formatCashChangeFor(formData.cashChangeFor) ?? "sem troco"}
          </p>
        ) : null}

        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          Depois do envio, o atendimento confirma o pagamento e libera para a cozinha.
        </p>
      </aside>
    </section>
  );
}
