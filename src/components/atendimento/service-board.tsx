"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { paymentLabels, paymentStatusLabels } from "@/lib/constants";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/cozinha/logout-button";

async function fetchPendingOrders(): Promise<Order[]> {
  const response = await fetch("/api/pedidos?scope=atendimento", {
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("401");
    }

    throw new Error("Nao foi possivel carregar os pedidos do atendimento.");
  }

  return response.json();
}

export function ServiceBoard({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [boardError, setBoardError] = useState("");

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const nextOrders = await fetchPendingOrders();
        setOrders(nextOrders);
        setBoardError("");
      } catch (error) {
        if (error instanceof Error && error.message.includes("401")) {
          setBoardError("Sua sessao expirou. Faca login novamente.");
          router.push("/acesso-cozinha");
          return;
        }

        setBoardError("Nao foi possivel atualizar o painel de atendimento.");
      }
    }, 12000);

    return () => window.clearInterval(timer);
  }, [router]);

  const totalPendingValue = useMemo(
    () => orders.reduce((acc, order) => acc + order.total, 0),
    [orders],
  );

  async function markAsPaid(orderId: string) {
    setLoadingId(orderId);
    setBoardError("");

    try {
      const response = await fetch(`/api/pedidos/${orderId}/pagamento/manual`, {
        method: "PATCH",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setBoardError("Sua sessao expirou. Faca login novamente.");
          router.push("/acesso-cozinha");
          return;
        }

        const data = await response.json();
        setBoardError(data.error ?? "Nao foi possivel marcar o pedido como pago.");
        return;
      }

      setOrders((current) => current.filter((order) => order.id !== orderId));
    } catch {
      setBoardError("Falha ao confirmar o pagamento no atendimento.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <header className="panel-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
              Atendimento
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase">
              Painel de liberacao de pedidos
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Aqui ficam apenas os pedidos aguardando pagamento. Quando o atendimento
              marcar como pago, o pedido sai desta tela e entra automaticamente na
              cozinha como novo.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="rounded-[24px] bg-[var(--foreground)] px-5 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.24em] text-white/70">
                Aguardando pagamento
              </p>
              <strong className="mt-2 block text-3xl font-black">{orders.length}</strong>
              <p className="mt-2 text-xs text-white/70">{formatCurrency(totalPendingValue)}</p>
            </div>
            <Link
              href="/cozinha"
              className="rounded-full border border-[var(--line)] bg-white/70 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--foreground)] transition-colors hover:bg-white"
            >
              Ir para cozinha
            </Link>
            <Link
              href="/painel"
              className="rounded-full border border-[var(--line)] bg-white/70 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--foreground)] transition-colors hover:bg-white"
            >
              Editar catalogo
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {boardError ? (
        <section className="panel-card p-5">
          <p className="rounded-2xl border border-[rgba(179,63,47,0.22)] bg-[rgba(179,63,47,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            {boardError}
          </p>
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-2">
        {orders.length === 0 ? (
          <div className="panel-card p-6 text-sm text-[var(--muted)] xl:col-span-2">
            Nenhum pedido aguardando pagamento no momento.
          </div>
        ) : (
          orders.map((order) => (
            <article
              key={order.id}
              className={cn(
                "panel-card p-6",
                loadingId === order.id ? "opacity-75" : "",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
                    Pedido {order.orderNumberFormatted}
                  </p>
                  <h2 className="mt-2 text-2xl font-black">{order.customerName}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {order.displayTime} | {paymentStatusLabels[order.paymentStatus]}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--surface-strong)] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--foreground)]">
                  {paymentLabels[order.paymentMethod]}
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[22px] border border-[var(--line)] bg-white/80 p-4 text-sm leading-7 text-[var(--muted)]">
                  <p><strong className="text-[var(--foreground)]">Telefone:</strong> {order.phone}</p>
                  <p><strong className="text-[var(--foreground)]">Endereco:</strong> {order.address}, {order.houseNumber}</p>
                  {order.deliveryArea ? (
                    <p><strong className="text-[var(--foreground)]">Bairro:</strong> {order.deliveryArea}</p>
                  ) : null}
                  {order.reference ? (
                    <p><strong className="text-[var(--foreground)]">Referencia:</strong> {order.reference}</p>
                  ) : null}
                </div>

                <div className="rounded-[22px] border border-[var(--line)] bg-[var(--foreground)] p-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                    Itens
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-white/85">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {"\u2022"} {item.productName}
                        <br />
                        {item.quantity}x {formatCurrency(item.unitPrice)} = {formatCurrency(item.subtotal)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="rounded-[18px] bg-[var(--surface)] px-4 py-3">
                  <span className="text-sm text-[var(--muted)]">Total do pedido</span>
                  <strong className="ml-3 text-lg text-[var(--brand)]">{formatCurrency(order.total)}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => markAsPaid(order.id)}
                  disabled={loadingId === order.id}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:bg-[rgba(184,68,31,0.45)]"
                >
                  <CheckCircle2 size={18} />
                  {loadingId === order.id ? "Confirmando..." : "Marcar como pago"}
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
