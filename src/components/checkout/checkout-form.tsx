"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CHECKOUT_DRAFT_STORAGE_KEY } from "@/lib/checkout-draft";
import { paymentLabels } from "@/lib/constants";
import { formatDeliveryEstimate } from "@/lib/delivery";
import { formatCurrency } from "@/lib/format";
import type { DeliveryAreaRule, PaymentMethod } from "@/lib/types";
import { checkoutSchema } from "@/lib/validators";
import { useCartStore } from "@/store/cart-store";

const paymentOptions: PaymentMethod[] = [
  "PIX",
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
        name: item.name,
        price: item.price,
        quantity: item.quantity,
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
      <form onSubmit={handleSubmit} className="panel-card p-6 sm:p-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
            Checkout
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase">Entrega e pagamento</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Preencha os dados para preparar o pedido, seguir para o pagamento e so depois liberar a cozinha e o WhatsApp da hamburgueria.
          </p>
          <p className="mt-3 inline-flex rounded-full bg-[var(--surface-strong)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]">
            Entrega: {formatCurrency(activeDeliveryFee)} | Previsao:{" "}
            {formatDeliveryEstimate(
              activeEstimatedDeliveryMin,
              activeEstimatedDeliveryMax,
            )}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-semibold">Nome</span>
            <input
              required
              value={formData.customerName}
              onChange={(event) => updateField("customerName", event.target.value)}
              className={`w-full rounded-2xl border bg-white px-4 py-3 outline-none transition-colors focus:border-[var(--brand)] ${
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
            <span className="text-sm font-semibold">Telefone</span>
            <input
              required
              inputMode="tel"
              placeholder="(84) 99999-9999"
              value={formData.phone}
              onChange={(event) => updateField("phone", formatPhone(event.target.value))}
              className={`w-full rounded-2xl border bg-white px-4 py-3 outline-none transition-colors focus:border-[var(--brand)] ${
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
                className={`w-full rounded-2xl border bg-white px-4 py-3 outline-none transition-colors focus:border-[var(--brand)] ${
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
            <span className="text-sm font-semibold">Forma de pagamento</span>
            <select
              value={formData.paymentMethod}
              onChange={(event) =>
                updateField("paymentMethod", event.target.value as PaymentMethod)
              }
              className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition-colors focus:border-[var(--brand)]"
            >
              {paymentOptions.map((option) => (
                <option key={option} value={option}>
                  {paymentLabels[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm font-semibold">Endereco</span>
            <input
              required
              value={formData.address}
              onChange={(event) => updateField("address", event.target.value)}
              className={`w-full rounded-2xl border bg-white px-4 py-3 outline-none transition-colors focus:border-[var(--brand)] ${
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
            <span className="text-sm font-semibold">Numero da casa</span>
            <input
              required
              value={formData.houseNumber}
              onChange={(event) => updateField("houseNumber", event.target.value)}
              className={`w-full rounded-2xl border bg-white px-4 py-3 outline-none transition-colors focus:border-[var(--brand)] ${
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
              className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition-colors focus:border-[var(--brand)]"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-5 rounded-2xl border border-[rgba(179,63,47,0.22)] bg-[rgba(179,63,47,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || items.length === 0}
          className="mt-8 inline-flex min-h-12 rounded-full bg-[var(--brand)] px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:bg-[rgba(184,68,31,0.45)]"
        >
          {isSubmitting ? "Preparando..." : "Continuar para confirmar"}
        </button>
      </form>

      <aside className="panel-card p-6 sm:p-8 xl:sticky xl:top-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
          Resumo
        </p>
        <div className="mt-5 space-y-4">
          {items.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-white/55 p-5 text-sm text-[var(--muted)]">
              Seu carrinho esta vazio.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="rounded-[22px] border border-[var(--line)] bg-white/75 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {item.quantity}x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <strong className="text-[var(--brand)]">
                    {formatCurrency(item.subtotal)}
                  </strong>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 rounded-[24px] bg-[var(--foreground)] p-5 text-white">
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
      </aside>
    </section>
  );
}
