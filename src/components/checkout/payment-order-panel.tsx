"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  LoaderCircle,
  MessageCircleMore,
  QrCode,
  RefreshCcw,
} from "lucide-react";
import { paymentLabels } from "@/lib/constants";
import { getPaymentInstructions } from "@/lib/payment";
import type { PaymentStatus } from "@/lib/types";

type PaymentOrderPanelProps = {
  orderId?: string;
  orderNumber: string;
  whatsappUrl?: string;
  paymentMethod?: "PIX" | "DINHEIRO" | "CARTAO_CREDITO" | "CARTAO_DEBITO";
  paymentCode?: string;
  paymentProvider?: string;
  gatewayStatus?: string;
};

type PublicPaymentState = {
  paymentStatus: PaymentStatus;
  paymentProvider?: string | null;
  paymentLink?: string | null;
};

export function PaymentOrderPanel({
  orderId,
  orderNumber,
  whatsappUrl,
  paymentMethod = "PIX",
  paymentCode,
  paymentProvider,
  gatewayStatus,
}: PaymentOrderPanelProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [paymentState, setPaymentState] = useState<PublicPaymentState | null>(null);

  const instructions = getPaymentInstructions(paymentMethod);
  const isHostedProvider = paymentProvider === "ASAAS";
  const isPaymentConfirmed = paymentState?.paymentStatus === "PAGO";

  const refreshPaymentStatus = useCallback(async (showLoader = false) => {
    if (!orderId) {
      return;
    }

    if (showLoader) {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch(`/api/pedidos/${orderId}/pagamento`, {
        cache: "no-store",
      });

      const data = (await response.json()) as PublicPaymentState & { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Nao foi possivel consultar o pagamento.");
        return;
      }

      setPaymentState(data);
      setError("");
    } catch {
      setError("Falha ao consultar o pagamento. Tente novamente.");
    } finally {
      if (showLoader) {
        setIsRefreshing(false);
      }
    }
  }, [orderId]);

  useEffect(() => {
    if (!isHostedProvider || !orderId) {
      return;
    }

    void refreshPaymentStatus();

    if (gatewayStatus !== "success") {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshPaymentStatus();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [gatewayStatus, isHostedProvider, orderId, refreshPaymentStatus]);

  useEffect(() => {
    if (isHostedProvider && isPaymentConfirmed && whatsappUrl) {
      const timeout = window.setTimeout(() => {
        window.location.href = whatsappUrl;
      }, 1200);

      return () => window.clearTimeout(timeout);
    }
  }, [isHostedProvider, isPaymentConfirmed, whatsappUrl]);

  async function handleConfirmPayment() {
    if (!orderId || !paymentCode) {
      setError("Nao foi possivel localizar os dados do pagamento.");
      return;
    }

    setIsConfirming(true);
    setError("");

    try {
      const response = await fetch(`/api/pedidos/${orderId}/pagamento`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Nao foi possivel confirmar o pagamento.");
        return;
      }

      if (whatsappUrl) {
        window.location.href = whatsappUrl;
      }
    } catch {
      setError("Falha ao confirmar o pagamento. Tente novamente.");
    } finally {
      setIsConfirming(false);
    }
  }

  function renderHostedStatus() {
    if (gatewayStatus === "cancelled") {
      return "O pagamento foi cancelado. Voce pode abrir o checkout novamente abaixo.";
    }

    if (gatewayStatus === "expired") {
      return "O link de pagamento expirou. Gere um novo pedido ou reabra o checkout, se ainda estiver disponivel.";
    }

    if (isPaymentConfirmed) {
      return "Pagamento confirmado. Estamos abrindo o WhatsApp e liberando o pedido para a cozinha.";
    }

    if (gatewayStatus === "success") {
      return "Recebemos o retorno do gateway e estamos validando a confirmacao do pagamento.";
    }

    return "Abra o checkout seguro, conclua o pagamento e volte automaticamente para esta pagina.";
  }

  return (
    <main className="container-shell py-10 pb-16">
      <section className="panel-card mx-auto max-w-4xl p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
          Pagamento
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase">Pedido {orderNumber}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">
          O pedido so entra na cozinha depois do pagamento confirmado.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div className="rounded-[28px] border border-[var(--line)] bg-white/75 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand)] text-white">
                {paymentMethod === "PIX" ? <QrCode size={22} /> : <CreditCard size={22} />}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">
                  Metodo
                </p>
                <h2 className="mt-1 text-2xl font-black uppercase">
                  {paymentLabels[paymentMethod]}
                </h2>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
              {isHostedProvider ? renderHostedStatus() : instructions.description}
            </p>

            <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-[var(--surface-strong)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">
                {isHostedProvider ? "Status do pagamento" : "Codigo de pagamento"}
              </p>
              <div className="mt-3 rounded-[20px] bg-white p-4 text-sm font-semibold leading-7 text-[var(--foreground)] break-all">
                {isHostedProvider
                  ? paymentState?.paymentStatus ?? "PENDENTE"
                  : paymentCode ?? "Pagamento em configuracao"}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--foreground)] p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              Liberacao da cozinha
            </p>
            <h2 className="mt-3 text-2xl font-black uppercase">
              Cozinha so recebe pedido pago
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/72">
              Assim a operacao trabalha apenas com pedido confirmado. Depois do
              pagamento, o pedido entra como novo no painel da cozinha.
            </p>

            <div className="mt-6 rounded-[22px] bg-white/8 p-4 text-sm leading-7 text-white/78">
              {isHostedProvider ? (
                <>
                  1. Abra o checkout seguro.
                  <br />
                  2. Finalize o pagamento no gateway.
                  <br />
                  3. O sistema valida pelo retorno e webhook.
                  <br />
                  4. So entao o WhatsApp e a cozinha sao liberados.
                </>
              ) : (
                <>
                  1. Confirme o pagamento nesta tela.
                  <br />
                  2. O sistema marca o pedido como pago.
                  <br />
                  3. O WhatsApp abre para a loja receber a mensagem.
                  <br />
                  4. A cozinha passa a enxergar o pedido.
                </>
              )}
            </div>
          </div>
        </div>

        {error ? (
          <p className="mt-6 rounded-2xl border border-[rgba(179,63,47,0.22)] bg-[rgba(179,63,47,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {isHostedProvider ? (
            <>
              {paymentState?.paymentLink ? (
                <a
                  href={paymentState.paymentLink}
                  target="_self"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[var(--brand-strong)]"
                >
                  <ExternalLink size={18} />
                  Abrir pagina de pagamento
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => void refreshPaymentStatus(true)}
                disabled={isRefreshing}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white/70 px-6 py-4 text-sm font-bold uppercase tracking-[0.16em]"
              >
                {isRefreshing ? <LoaderCircle className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
                Atualizar status
              </button>
              {isPaymentConfirmed && whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(26,132,76,0.24)] bg-[rgba(26,132,76,0.1)] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-[var(--success)]"
                >
                  <CheckCircle2 size={18} />
                  Abrir WhatsApp
                </a>
              ) : null}
            </>
          ) : (
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isConfirming}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:bg-[rgba(184,68,31,0.45)]"
            >
              <MessageCircleMore size={18} />
              {isConfirming ? "Confirmando pagamento..." : instructions.cta}
            </button>
          )}
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white/70 px-6 py-4 text-sm font-bold uppercase tracking-[0.16em]"
          >
            Voltar ao checkout
          </Link>
        </div>
      </section>
    </main>
  );
}
