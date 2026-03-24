"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  kitchenStatusActions,
  orderStatusLabels,
  orderStatusSequence,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

async function fetchOrders(): Promise<Order[]> {
  const response = await fetch("/api/pedidos?scope=kitchen", {
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("401");
    }

    throw new Error("Nao foi possivel carregar os pedidos.");
  }

  return response.json();
}

export function KitchenBoard({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [boardError, setBoardError] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(true);
  const previousNewOrderIdsRef = useRef(
    new Set(
      initialOrders
        .filter((order) => order.status === "NOVO")
        .map((order) => order.id),
    ),
  );

  function playAlertTone() {
    if (typeof window === "undefined") {
      return;
    }

    const audioContext =
      window.AudioContext
        ? new window.AudioContext()
        : "webkitAudioContext" in window
          ? new (window as Window & { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext()
          : null;

    if (!audioContext) {
      return;
    }

    const masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    masterGain.gain.setValueAtTime(0.9, audioContext.currentTime);

    const strikeOffsets = [0, 0.22, 0.48];
    const strikeDuration = 0.9;

    for (const offset of strikeOffsets) {
      const start = audioContext.currentTime + offset;
      const fundamental = audioContext.createOscillator();
      const harmonic = audioContext.createOscillator();
      const shimmer = audioContext.createOscillator();
      const strikeGain = audioContext.createGain();

      fundamental.type = "sine";
      harmonic.type = "triangle";
      shimmer.type = "square";

      fundamental.frequency.setValueAtTime(1320, start);
      harmonic.frequency.setValueAtTime(2640, start);
      shimmer.frequency.setValueAtTime(3960, start);

      strikeGain.gain.setValueAtTime(0.0001, start);
      strikeGain.gain.exponentialRampToValueAtTime(0.45, start + 0.01);
      strikeGain.gain.exponentialRampToValueAtTime(0.14, start + 0.12);
      strikeGain.gain.exponentialRampToValueAtTime(0.0001, start + strikeDuration);

      fundamental.connect(strikeGain);
      harmonic.connect(strikeGain);
      shimmer.connect(strikeGain);
      strikeGain.connect(masterGain);

      fundamental.start(start);
      harmonic.start(start);
      shimmer.start(start);

      fundamental.stop(start + strikeDuration);
      harmonic.stop(start + strikeDuration);
      shimmer.stop(start + strikeDuration);
    }

    if ("vibrate" in navigator) {
      navigator.vibrate([120, 80, 120]);
    }

    window.setTimeout(() => {
      void audioContext.close();
    }, 1800);
  }

  useEffect(() => {
    const storedValue = window.localStorage.getItem("kitchen-sound-enabled");

    if (storedValue === "false") {
      setSoundEnabled(false);
      soundEnabledRef.current = false;
    }
  }, []);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    window.localStorage.setItem(
      "kitchen-sound-enabled",
      soundEnabled ? "true" : "false",
    );
  }, [soundEnabled]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const nextOrders = await fetchOrders();
        const nextNewOrderIds = new Set(
          nextOrders
            .filter((order) => order.status === "NOVO")
            .map((order) => order.id),
        );
        const hasIncomingOrder = Array.from(nextNewOrderIds).some(
          (orderId) => !previousNewOrderIdsRef.current.has(orderId),
        );

        setOrders(nextOrders);
        previousNewOrderIdsRef.current = nextNewOrderIds;
        setBoardError("");

        if (hasIncomingOrder && soundEnabledRef.current) {
          playAlertTone();
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("401")) {
          setBoardError("Sua sessao expirou. Faca login novamente.");
          router.push("/acesso-cozinha");
          return;
        }

        setBoardError("Nao foi possivel atualizar os pedidos agora.");
        return;
      }
    }, 15000);

    return () => window.clearInterval(timer);
  }, [router]);

  const groupedOrders = useMemo(() => {
    return orderStatusSequence.reduce<Record<OrderStatus, Order[]>>(
      (acc, status) => {
        acc[status] = orders.filter((order) => order.status === status);
        return acc;
      },
      {
        NOVO: [],
        EM_PREPARO: [],
        PRONTO: [],
        ENTREGUE: [],
      },
    );
  }, [orders]);

  function getOrderAgeInMinutes(createdAt: string) {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.round((now - created) / 60000));
  }

  async function changeStatus(orderId: string, status: OrderStatus) {
    setLoadingId(orderId);

    try {
      const response = await fetch(`/api/pedidos/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setBoardError("Sua sessao expirou. Faca login novamente.");
          router.push("/acesso-cozinha");
          return;
        }

        setBoardError("Nao foi possivel atualizar o status do pedido.");
        return;
      }

      const updatedOrder: Order = await response.json();
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? updatedOrder : order)),
      );
      setBoardError("");
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
              Operacao
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase">
              Painel da cozinha
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Atualizacao automatica a cada 15 segundos. Esta tela mostra
              apenas pedidos com pagamento confirmado, prontos para entrar na
              operacao da cozinha.
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">
              Campainha reforcada para cozinha, com varias batidas e volume mais alto.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <div className="rounded-[24px] bg-[var(--foreground)] px-5 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.24em] text-white/70">
                Pedidos pagos
              </p>
              <strong className="mt-2 block text-3xl font-black">
                {orders.length}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled((current) => !current)}
              className={cn(
                "rounded-full border px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] transition-colors",
                soundEnabled
                  ? "border-[var(--brand)] bg-[rgba(184,68,31,0.08)] text-[var(--brand)]"
                  : "border-[var(--line)] bg-white/70 text-[var(--muted)] hover:bg-white",
              )}
            >
              {soundEnabled ? "Campainha ligada" : "Campainha desligada"}
            </button>
            <button
              type="button"
              onClick={playAlertTone}
              className="rounded-full border border-[var(--line)] bg-white/70 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--foreground)] transition-colors hover:bg-white"
            >
              Testar som
            </button>
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

      <section className="overflow-x-auto pb-2">
        <div className="grid min-w-[1180px] grid-cols-4 gap-5">
          {orderStatusSequence.map((status) => (
            <div
              key={status}
              className="rounded-[30px] border border-[var(--line)] bg-[rgba(255,248,241,0.84)] p-4 shadow-[0_20px_45px_rgba(73,38,18,0.08)]"
            >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
                  Etapa
                </p>
                <h2 className="mt-1 text-xl font-black">
                  {orderStatusLabels[status]}
                </h2>
              </div>
              <span className="rounded-full bg-white px-3 py-2 text-sm font-bold text-[var(--foreground)]">
                {groupedOrders[status].length}
              </span>
            </div>

            <div className="space-y-4">
              {groupedOrders[status].length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-white/60 p-4 text-sm text-[var(--muted)]">
                  Nenhum pedido nesta coluna.
                </div>
              ) : (
                groupedOrders[status].map((order) => {
                  const action = kitchenStatusActions[order.status];
                  const ageInMinutes = getOrderAgeInMinutes(order.createdAt);
                  const isFresh = ageInMinutes <= 8 && order.status === "NOVO";
                  const isDelayed = ageInMinutes >= 25 && order.status !== "ENTREGUE";

                  return (
                    <article
                      key={order.id}
                      className={cn(
                        "rounded-[24px] border bg-white p-4",
                        isFresh
                          ? "border-[var(--brand)] shadow-[0_0_0_2px_rgba(184,68,31,0.12)]"
                          : isDelayed
                            ? "border-[rgba(179,63,47,0.24)]"
                            : "border-[var(--line)]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
                            Pedido {order.orderNumberFormatted}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            Horario: {order.displayTime}
                          </p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                            {ageInMinutes} min
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <strong className="rounded-full bg-[var(--surface-strong)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--foreground)]">
                            {orderStatusLabels[order.status]}
                          </strong>
                          {isFresh ? (
                            <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
                              Novo agora
                            </span>
                          ) : null}
                          {isDelayed ? (
                            <span className="rounded-full bg-[rgba(179,63,47,0.12)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--danger)]">
                              Prioridade
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4">
                        <h3 className="text-lg font-black">
                          {order.customerName}
                        </h3>
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--foreground)]">
                          {order.items.map((item) => (
                            <li key={item.id}>
                              {"\u2022"} {item.productName}
                              <br />
                              {item.quantity}x {formatCurrency(item.unitPrice)} ={" "}
                              {formatCurrency(item.subtotal)}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 flex items-center justify-between rounded-[18px] bg-[var(--surface)] px-4 py-3">
                        <span className="text-sm text-[var(--muted)]">
                          Total
                        </span>
                        <strong className="text-lg text-[var(--brand)]">
                          {formatCurrency(order.total)}
                        </strong>
                      </div>

                      <div className="mt-4 space-y-3">
                        <button
                          type="button"
                          disabled={!action.nextStatus || loadingId === order.id}
                          onClick={() =>
                            action.nextStatus
                              ? changeStatus(order.id, action.nextStatus)
                              : null
                          }
                          className={cn(
                            "w-full rounded-full px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] transition-colors",
                            action.nextStatus
                              ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
                              : "cursor-default bg-[var(--surface-strong)] text-[var(--muted)]",
                          )}
                        >
                          {loadingId === order.id
                            ? "Atualizando..."
                            : action.label}
                        </button>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {orderStatusSequence.map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => changeStatus(order.id, step)}
                              disabled={loadingId === order.id}
                              className={cn(
                                "rounded-2xl border px-2 py-3 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors",
                                order.status === step
                                  ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]",
                              )}
                            >
                              {orderStatusLabels[step]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
