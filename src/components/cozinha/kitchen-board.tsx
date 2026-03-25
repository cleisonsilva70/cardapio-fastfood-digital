"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, Trash2, Volume2 } from "lucide-react";
import {
  kitchenStatusActions,
  orderStatusLabels,
  orderStatusSequence,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const [isClearingDelivered, setIsClearingDelivered] = useState(false);
  const [boardError, setBoardError] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundProfile, setSoundProfile] = useState<"restaurant" | "soft">("restaurant");
  const [search, setSearch] = useState("");
  const soundEnabledRef = useRef(true);
  const previousNewOrderIdsRef = useRef(
    new Set(
      initialOrders
        .filter((order) => order.status === "NOVO")
        .map((order) => order.id),
    ),
  );

  const playAlertTone = useCallback(() => {
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
    masterGain.gain.setValueAtTime(soundProfile === "restaurant" ? 0.9 : 0.45, audioContext.currentTime);

    const strikeOffsets =
      soundProfile === "restaurant" ? [0, 0.22, 0.48] : [0, 0.28];
    const strikeDuration = soundProfile === "restaurant" ? 0.9 : 0.7;

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
  }, [soundProfile]);

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
  }, [playAlertTone, router]);

  const groupedOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    const visibleOrders = !term
      ? orders
      : orders.filter((order) => {
          return (
            order.customerName.toLowerCase().includes(term) ||
            order.orderNumberFormatted.toLowerCase().includes(term)
          );
        });

    return orderStatusSequence.reduce<Record<OrderStatus, Order[]>>(
      (acc, status) => {
        acc[status] = visibleOrders.filter((order) => order.status === status);
        return acc;
      },
      {
        NOVO: [],
        EM_PREPARO: [],
        PRONTO: [],
        ENTREGUE: [],
      },
    );
  }, [orders, search]);

  const totalNewOrders = groupedOrders.NOVO.length;
  const totalReadyOrders = groupedOrders.PRONTO.length;
  const totalDelayedOrders = orders.filter((order) => {
    const ageInMinutes = getOrderAgeInMinutes(order.createdAt);
    return ageInMinutes >= 25 && order.status !== "ENTREGUE";
  }).length;

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

  async function clearDeliveredColumn() {
    setIsClearingDelivered(true);
    setBoardError("");

    try {
      const response = await fetch("/api/pedidos/entregues/reset", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setBoardError("Sua sessao expirou. Faca login novamente.");
          router.push("/acesso-cozinha");
          return;
        }

        setBoardError(data.error ?? "Nao foi possivel limpar os pedidos entregues.");
        return;
      }

      setOrders((current) =>
        current.filter(
          (order) => !(order.status === "ENTREGUE" && !order.kitchenClearedAt),
        ),
      );
    } catch {
      setBoardError("Falha ao limpar a coluna de pedidos entregues.");
    } finally {
      setIsClearingDelivered(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="panel-card luxury-section overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="glass-pill inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
              Operacao
            </p>
            <h1 className="mt-4 text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl">
              Painel da cozinha
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              Atualizacao automatica a cada 15 segundos. Esta tela mostra
              apenas pedidos com pagamento confirmado, prontos para entrar na
              operacao da cozinha.
            </p>
          </div>
          <div className="flex w-full max-w-[720px] flex-col gap-3 self-start lg:items-end">
            <div className="flex w-full flex-wrap justify-start gap-3 lg:justify-end">
              <button
                type="button"
                onClick={() => setSoundEnabled((current) => !current)}
                className={cn(
                  "rounded-full px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] transition-colors",
                  soundEnabled
                    ? "glass-pill text-[var(--brand)]"
                    : "glass-pill text-[var(--muted)] hover:bg-white",
                )}
              >
                {soundEnabled ? "Campainha ligada" : "Campainha desligada"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setSoundProfile((current) =>
                    current === "restaurant" ? "soft" : "restaurant",
                  )
                }
                className="glass-pill inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--foreground)] transition-colors hover:bg-white"
              >
                <Volume2 size={16} />
                {soundProfile === "restaurant" ? "Som restaurante" : "Som suave"}
              </button>
              <button
                type="button"
                onClick={playAlertTone}
                className="glass-pill rounded-full px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--foreground)] transition-colors hover:bg-white"
              >
                Testar som
              </button>
              <Link
                href="/atendimento"
                className="glass-pill rounded-full px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--foreground)] transition-colors hover:bg-white"
              >
                Abrir atendimento
              </Link>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <div className="rounded-[26px] border border-[var(--line)] bg-white/80 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                  Novos na fila
                </p>
                <strong className="mt-2 block text-3xl font-black">{totalNewOrders}</strong>
              </div>
              <div className="rounded-[26px] border border-[rgba(184,68,31,0.12)] bg-[rgba(184,68,31,0.08)] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                  Prioridade
                </p>
                <strong className="mt-2 block text-3xl font-black text-[var(--danger)]">
                  {totalDelayedOrders}
                </strong>
              </div>
            </div>
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
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full max-w-md">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por cliente ou pedido"
              className="w-full rounded-full border border-[var(--line)] bg-white py-3 pl-11 pr-4 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <div className="glass-pill rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">
              {search ? "Filtro ativo" : "Todos os pedidos"}
            </div>
            <div className="glass-pill rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">
              Prontos agora: {totalReadyOrders}
            </div>
          </div>
        </div>
        <div className="grid min-w-[1240px] grid-cols-4 gap-5">
          {orderStatusSequence.map((status) => (
            <div
              key={status}
              className="luxury-section rounded-[30px] border border-[var(--line)] bg-[rgba(255,248,241,0.84)] p-4 shadow-[0_20px_45px_rgba(73,38,18,0.08)]"
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
              <div className="flex items-center gap-2">
                {status === "ENTREGUE" ? (
                  <button
                    type="button"
                    onClick={clearDeliveredColumn}
                    disabled={isClearingDelivered || groupedOrders[status].length === 0}
                    className="glass-pill inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-45"
                    aria-label="Limpar coluna de entregues"
                    title="Limpar coluna de entregues"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
                <span className="rounded-full bg-white px-3 py-2 text-sm font-bold text-[var(--foreground)]">
                  {groupedOrders[status].length}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {groupedOrders[status].length === 0 ? (
                <div className="panel-subtle border-dashed p-4 text-sm text-[var(--muted)]">
                  Nenhum pedido nesta coluna.
                </div>
              ) : (
                groupedOrders[status].map((order) => {
                  const action = kitchenStatusActions[order.status];
                  const ageInMinutes = getOrderAgeInMinutes(order.createdAt);
                  const isFresh = ageInMinutes <= 8 && order.status === "NOVO";
                  const isDelayed = ageInMinutes >= 25 && order.status !== "ENTREGUE";
                  const isDelivered = order.status === "ENTREGUE";

                  return (
                    <article
                      key={order.id}
                      className={cn(
                        "panel-card luxury-section relative overflow-hidden p-6",
                        "min-h-[420px]",
                        isFresh
                          ? "border-[var(--brand)] shadow-[0_0_0_2px_rgba(184,68,31,0.12)]"
                          : isDelayed
                            ? "border-[rgba(179,63,47,0.24)]"
                            : "border-[var(--line)]",
                        isDelivered ? "bg-[rgba(255,255,255,0.78)]" : "",
                      )}
                    >
                      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[color-mix(in_srgb,var(--accent)_32%,transparent)] blur-2xl" />
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
                            Pedido {order.orderNumberFormatted}
                          </p>
                          <h3 className="mt-2 text-2xl font-black">{order.customerName}</h3>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {order.displayTime} | {orderStatusLabels[order.status]}
                          </p>
                          {isFresh ? (
                            <p className="mt-2 inline-flex rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
                              Pedido novo
                            </p>
                          ) : null}
                          {isDelayed ? (
                            <p className="mt-2 inline-flex rounded-full bg-[rgba(179,63,47,0.12)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--danger)]">
                              Prioridade ha {ageInMinutes} min
                            </p>
                          ) : null}
                          {!isDelayed && !isFresh ? (
                            <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                              {isDelivered ? "Pedido finalizado" : `${ageInMinutes} min de operacao`}
                            </p>
                          ) : null}
                        </div>
                        <span className="glass-pill rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--foreground)]">
                          {orderStatusLabels[order.status]}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4">
                        <div className="panel-subtle p-4 text-sm leading-7 text-[var(--muted)]">
                          <p>
                            <strong className="text-[var(--foreground)]">Horario:</strong> {order.displayTime}
                          </p>
                          <p>
                            <strong className="text-[var(--foreground)]">Status:</strong> {orderStatusLabels[order.status]}
                          </p>
                          <p>
                            <strong className="text-[var(--foreground)]">Tempo:</strong> {isDelivered ? "Pedido finalizado" : `${ageInMinutes} min`}
                          </p>
                        </div>

                        {isDelivered ? (
                          <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                            <p>{order.items.length} item(ns) finalizados neste pedido.</p>
                            <p className="mt-1">Pedido concluido e pronto para sair da tela quando desejar.</p>
                          </div>
                        ) : (
                          <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(35,21,15,0.98),rgba(57,31,21,0.92))] p-4 text-white shadow-[0_18px_38px_rgba(35,21,15,0.18)]">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                              Itens
                            </p>
                            <ul className="mt-3 space-y-2 text-sm leading-6 text-white/85">
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
                        )}
                      </div>

                      <div className="mt-5 flex items-center justify-between rounded-[18px] bg-[var(--surface)] px-4 py-3">
                        <span className="text-sm text-[var(--muted)]">Total do pedido</span>
                        <strong className="text-lg text-[var(--brand)]">{formatCurrency(order.total)}</strong>
                      </div>

                      <div className="mt-5">
                        <button
                          type="button"
                          disabled={!action.nextStatus || loadingId === order.id}
                          onClick={() =>
                            action.nextStatus
                              ? changeStatus(order.id, action.nextStatus)
                              : null
                          }
                          className={cn(
                            "w-full rounded-full px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] transition-all",
                            action.nextStatus
                              ? "bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] text-white shadow-[0_16px_26px_rgba(145,47,18,0.18)] hover:-translate-y-0.5"
                              : "cursor-default bg-[var(--surface-strong)] text-[var(--muted)]",
                          )}
                        >
                          {loadingId === order.id
                            ? "Atualizando..."
                            : action.label}
                        </button>
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
