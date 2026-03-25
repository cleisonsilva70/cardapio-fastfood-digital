"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, Search, Trash2, Volume2 } from "lucide-react";
import {
  formatCurrency,
  formatDateInputValue,
  formatDateTimeLabel,
  formatMonthInputValue,
  formatYearValue,
  parseDateInputValue,
} from "@/lib/format";
import { paymentLabels, paymentStatusLabels } from "@/lib/constants";
import type { Order, PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

type DateFilterMode = "DIA" | "SEMANA" | "MES" | "ANO" | "PERIODO";

async function fetchAtendimentoOrders(): Promise<Order[]> {
  const response = await fetch("/api/pedidos", {
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

function getIsoWeekValue(date: Date) {
  const target = new Date(date);
  const dayNumber = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDayNumber = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNumber + 3);
  const weekNumber =
    1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));

  return `${target.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function getIsoWeekRange(weekValue: string) {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekValue);

  if (!match) {
    return null;
  }

  const [, yearText, weekText] = match;
  const year = Number(yearText);
  const week = Number(weekText);
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simple.getDay();
  const monday = new Date(simple);

  if (dayOfWeek <= 4) {
    monday.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    monday.setDate(simple.getDate() + 8 - simple.getDay());
  }

  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

function matchesSelectedDateFilter(
  createdAtValue: string,
  dateFilterMode: DateFilterMode,
  selectedDay: string,
  selectedWeek: string,
  selectedMonth: string,
  selectedYear: string,
  rangeStart: string,
  rangeEnd: string,
) {
  const createdAt = new Date(createdAtValue);

  if (dateFilterMode === "DIA") {
    return selectedDay ? formatDateInputValue(createdAt) === selectedDay : true;
  }

  if (dateFilterMode === "SEMANA") {
    const range = getIsoWeekRange(selectedWeek);
    return range ? createdAt >= range.start && createdAt <= range.end : true;
  }

  if (dateFilterMode === "MES") {
    return selectedMonth ? formatMonthInputValue(createdAt) === selectedMonth : true;
  }

  if (dateFilterMode === "ANO") {
    return selectedYear ? formatYearValue(createdAt) === selectedYear : true;
  }

  if (dateFilterMode === "PERIODO") {
    if (!rangeStart && !rangeEnd) {
      return true;
    }

    const start = rangeStart ? parseDateInputValue(rangeStart) : null;
    const end = rangeEnd ? parseDateInputValue(rangeEnd) : null;

    if (start) {
      start.setHours(0, 0, 0, 0);
    }

    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    return (!start || createdAt >= start) && (!end || createdAt <= end);
  }

  return true;
}

export function ServiceBoard({ initialOrders }: { initialOrders: Order[] }) {
  const now = new Date();
  const currentDay = formatDateInputValue(now);
  const currentMonth = formatMonthInputValue(now);
  const currentYear = formatYearValue(now);
  const currentWeek = getIsoWeekValue(now);

  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [boardError, setBoardError] = useState("");
  const [boardSuccess, setBoardSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"PENDENTES" | "PAGOS">("PENDENTES");
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | "TODOS">("TODOS");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>("DIA");
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [rangeStart, setRangeStart] = useState(currentDay);
  const [rangeEnd, setRangeEnd] = useState(currentDay);
  const soundEnabledRef = useRef(true);
  const previousOrderIdsRef = useRef(new Set(initialOrders.map((order) => order.id)));

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
    masterGain.gain.setValueAtTime(0.75, audioContext.currentTime);

    for (const offset of [0, 0.2, 0.46]) {
      const start = audioContext.currentTime + offset;
      const fundamental = audioContext.createOscillator();
      const harmonic = audioContext.createOscillator();
      const strikeGain = audioContext.createGain();

      fundamental.type = "sine";
      harmonic.type = "triangle";
      fundamental.frequency.setValueAtTime(1320, start);
      harmonic.frequency.setValueAtTime(2640, start);

      strikeGain.gain.setValueAtTime(0.0001, start);
      strikeGain.gain.exponentialRampToValueAtTime(0.4, start + 0.01);
      strikeGain.gain.exponentialRampToValueAtTime(0.12, start + 0.12);
      strikeGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.85);

      fundamental.connect(strikeGain);
      harmonic.connect(strikeGain);
      strikeGain.connect(masterGain);

      fundamental.start(start);
      harmonic.start(start);
      fundamental.stop(start + 0.85);
      harmonic.stop(start + 0.85);
    }

    if ("vibrate" in navigator) {
      navigator.vibrate([100, 70, 100]);
    }

    window.setTimeout(() => {
      void audioContext.close();
    }, 1600);
  }, []);

  useEffect(() => {
    const storedValue = window.localStorage.getItem("service-sound-enabled");

    if (storedValue === "false") {
      setSoundEnabled(false);
      soundEnabledRef.current = false;
    }
  }, []);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    window.localStorage.setItem(
      "service-sound-enabled",
      soundEnabled ? "true" : "false",
    );
  }, [soundEnabled]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const nextOrders = await fetchAtendimentoOrders();
        const nextOrderIds = new Set(nextOrders.map((order) => order.id));
        const hasIncomingOrder = Array.from(nextOrderIds).some(
          (orderId) => !previousOrderIdsRef.current.has(orderId),
        );

        setOrders(nextOrders);
        previousOrderIdsRef.current = nextOrderIds;
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

        setBoardError("Nao foi possivel atualizar o painel de atendimento.");
      }
    }, 12000);

    return () => window.clearInterval(timer);
  }, [playAlertTone, router]);

  const ordersInSelectedPeriod = useMemo(
    () =>
      orders.filter((order) =>
        matchesSelectedDateFilter(
          order.createdAt,
          dateFilterMode,
          selectedDay,
          selectedWeek,
          selectedMonth,
          selectedYear,
          rangeStart,
          rangeEnd,
        ),
      ),
    [dateFilterMode, orders, rangeEnd, rangeStart, selectedDay, selectedMonth, selectedWeek, selectedYear],
  );

  const totalPendingValue = useMemo(
    () =>
      ordersInSelectedPeriod
        .filter((order) => order.paymentStatus === "PENDENTE")
        .reduce((acc, order) => acc + order.total, 0),
    [ordersInSelectedPeriod],
  );

  const paidOrdersCount = useMemo(
    () => ordersInSelectedPeriod.filter((order) => order.paymentStatus === "PAGO").length,
    [ordersInSelectedPeriod],
  );

  const pendingOrdersCount = useMemo(
    () => ordersInSelectedPeriod.filter((order) => order.paymentStatus === "PENDENTE").length,
    [ordersInSelectedPeriod],
  );
  const delayedOrdersCount = useMemo(
    () =>
      ordersInSelectedPeriod.filter((order) => {
        if (order.paymentStatus !== "PENDENTE") {
          return false;
        }

        return Date.now() - new Date(order.createdAt).getTime() >= 15 * 60 * 1000;
      }).length,
    [ordersInSelectedPeriod],
  );
  const deliveredOrdersCount = useMemo(
    () => ordersInSelectedPeriod.filter((order) => order.status === "ENTREGUE").length,
    [ordersInSelectedPeriod],
  );
  const totalRevenue = useMemo(
    () =>
      ordersInSelectedPeriod
        .filter((order) => order.paymentStatus === "PAGO")
        .reduce((acc, order) => acc + order.total, 0),
    [ordersInSelectedPeriod],
  );
  const averageTicket = useMemo(
    () => (paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0),
    [paidOrdersCount, totalRevenue],
  );
  const recentOrders = useMemo(() => ordersInSelectedPeriod.slice(0, 3), [ordersInSelectedPeriod]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus =
        filter === "PENDENTES"
          ? order.paymentStatus === "PENDENTE"
          : order.paymentStatus === "PAGO";
      const matchesPayment =
        paymentFilter === "TODOS" || order.paymentMethod === paymentFilter;
      const matchesDate = matchesSelectedDateFilter(
        order.createdAt,
        dateFilterMode,
        selectedDay,
        selectedWeek,
        selectedMonth,
        selectedYear,
        rangeStart,
        rangeEnd,
      );

      const matchesSearch =
        !term ||
        order.customerName.toLowerCase().includes(term) ||
        order.orderNumberFormatted.toLowerCase().includes(term) ||
        order.phone.toLowerCase().includes(term);

      return matchesStatus && matchesPayment && matchesDate && matchesSearch;
    });
  }, [dateFilterMode, filter, orders, paymentFilter, rangeEnd, rangeStart, search, selectedDay, selectedMonth, selectedWeek, selectedYear]);

  function getWaitMinutes(createdAt: string) {
    return Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
  }

  async function archiveVisibleOrders() {
    if (filteredOrders.length === 0) {
      setBoardError("Nao ha pedidos visiveis para arquivar nesse filtro.");
      setBoardSuccess("");
      return;
    }

    const confirmed = window.confirm(
      `Isso vai arquivar ${filteredOrders.length} pedidos visiveis no atendimento. Deseja continuar?`,
    );

    if (!confirmed) {
      return;
    }

    setBoardError("");
    setBoardSuccess("");

    try {
      const response = await fetch("/api/pedidos/reset", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderIds: filteredOrders.map((order) => order.id),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setBoardError(data.error ?? "Nao foi possivel arquivar os pedidos desse filtro.");
        return;
      }

      const visibleOrderIds = new Set(filteredOrders.map((order) => order.id));
      setOrders((current) => current.filter((order) => !visibleOrderIds.has(order.id)));
      setBoardSuccess(
        data.cleared > 0
          ? `${data.cleared} pedidos arquivados no atendimento.`
          : "Nao havia pedidos visiveis para arquivar.",
      );
    } catch {
      setBoardError("Falha ao arquivar os pedidos visiveis.");
    }
  }

  function exportVisibleOrdersCsv() {
    if (filteredOrders.length === 0) {
      setBoardError("Nao ha pedidos visiveis para exportar.");
      setBoardSuccess("");
      return;
    }

    const rows = [
      [
        "pedido",
        "cliente",
        "telefone",
        "status",
        "pagamento_status",
        "pagamento_metodo",
        "total",
        "data_hora",
        "itens",
      ],
      ...filteredOrders.map((order) => [
        order.orderNumberFormatted,
        order.customerName,
        order.phone,
        order.status,
        order.paymentStatus,
        paymentLabels[order.paymentMethod],
        order.total.toFixed(2).replace(".", ","),
        formatDateTimeLabel(new Date(order.createdAt)),
        order.items.map((item) => `${item.quantity}x ${item.productName}`).join(" | "),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(";"),
      )
      .join("\n");

    const filename = `atendimento-${dateFilterMode.toLowerCase()}-${Date.now()}.csv`;
    const blob = new Blob(["\uFEFF", csv], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBoardError("");
    setBoardSuccess(`Arquivo ${filename} exportado com sucesso.`);
  }

  async function markAsPaid(orderId: string) {
    setLoadingId(orderId);
    setBoardError("");
    setBoardSuccess("");

    try {
      const response = await fetch(`/api/pedidos/${orderId}/pagamento/manual`, {
        method: "PATCH",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setBoardError("Sua sessao expirou. Faca login novamente.");
          setBoardSuccess("");
          router.push("/acesso-cozinha");
          return;
        }

        const data = await response.json();
        setBoardError(data.error ?? "Nao foi possivel marcar o pedido como pago.");
        setBoardSuccess("");
        return;
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                paymentStatus: "PAGO",
              }
            : order,
        ),
      );
      const releasedOrder = orders.find((order) => order.id === orderId);
      setBoardSuccess(
        releasedOrder
          ? `Pedido ${releasedOrder.orderNumberFormatted} liberado para a cozinha.`
          : "Pagamento confirmado e pedido liberado para a cozinha.",
      );
    } catch {
      setBoardError("Falha ao confirmar o pagamento no atendimento.");
      setBoardSuccess("");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <header className="panel-card luxury-section overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="glass-pill inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
              Atendimento
            </p>
            <h1 className="mt-4 text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl">
              Atendimento e liberacao de pedidos
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              Confirme os pedidos pagos e libere apenas o que estiver pronto para
              seguir para a cozinha.
            </p>
          </div>
          <div className="flex w-full max-w-[620px] flex-col gap-3 self-start lg:items-end">
            <div className="flex w-full justify-end gap-3">
              <Link
                href="/cozinha"
                target="_blank"
                rel="noreferrer"
                className="glass-pill rounded-full px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--foreground)] transition-colors hover:bg-white"
              >
                Ir para cozinha
              </Link>
              <button
                type="button"
                onClick={() => setSoundEnabled((current) => !current)}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] ${
                  soundEnabled
                    ? "bg-[var(--foreground)] text-white"
                    : "glass-pill text-[var(--foreground)]"
                }`}
              >
                <Volume2 size={16} />
                {soundEnabled ? "Som ligado" : "Som desligado"}
              </button>
            </div>
            <div className="grid w-full gap-3 md:grid-cols-3">
              <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(35,21,15,0.96),rgba(57,31,21,0.92))] px-5 py-4 text-white shadow-[0_20px_50px_rgba(35,21,15,0.24)]">
                <p className="text-xs uppercase tracking-[0.24em] text-white/70">Aguardando pagamento</p>
                <strong className="mt-2 block text-3xl font-black">{pendingOrdersCount}</strong>
                <p className="mt-2 text-xs text-white/70">{formatCurrency(totalPendingValue)}</p>
              </div>
              <div className="rounded-[26px] border border-[rgba(184,68,31,0.12)] bg-[rgba(184,68,31,0.08)] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Em atraso</p>
                <strong className="mt-2 block text-3xl font-black text-[var(--danger)]">
                  {delayedOrdersCount}
                </strong>
              </div>
              <div className="rounded-[26px] border border-[var(--line)] bg-white/80 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Pagos no periodo</p>
                <strong className="mt-2 block text-3xl font-black">{paidOrdersCount}</strong>
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

      {boardSuccess ? (
        <section className="panel-card p-5">
          <p className="rounded-2xl border border-[rgba(39,147,108,0.22)] bg-[rgba(39,147,108,0.08)] px-4 py-3 text-sm text-[var(--success)]">
            {boardSuccess}
          </p>
        </section>
      ) : null}

      <section className="panel-card luxury-section p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
              Periodo dos indicadores
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Escolha o periodo que deve ser considerado nos blocos de faturamento,
              ticket medio e totais do atendimento.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:min-w-[360px]">
            <select
              value={dateFilterMode}
              onChange={(event) => setDateFilterMode(event.target.value as DateFilterMode)}
              className="rounded-[18px] border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--foreground)]"
            >
              <option value="DIA">Dia</option>
              <option value="SEMANA">Semana</option>
              <option value="MES">Mes</option>
              <option value="ANO">Ano</option>
              <option value="PERIODO">Periodo personalizado</option>
            </select>

            {dateFilterMode === "DIA" ? (
              <input
                type="date"
                value={selectedDay}
                onChange={(event) => setSelectedDay(event.target.value)}
                className="rounded-[18px] border border-[var(--line)] bg-white px-4 py-3 text-sm"
              />
            ) : null}

            {dateFilterMode === "SEMANA" ? (
              <input
                type="week"
                value={selectedWeek}
                onChange={(event) => setSelectedWeek(event.target.value)}
                className="rounded-[18px] border border-[var(--line)] bg-white px-4 py-3 text-sm"
              />
            ) : null}

            {dateFilterMode === "MES" ? (
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="rounded-[18px] border border-[var(--line)] bg-white px-4 py-3 text-sm"
              />
            ) : null}

            {dateFilterMode === "ANO" ? (
              <input
                type="number"
                min="2020"
                max="2100"
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                placeholder="2026"
                className="rounded-[18px] border border-[var(--line)] bg-white px-4 py-3 text-sm"
              />
            ) : null}

            {dateFilterMode === "PERIODO" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="date"
                  value={rangeStart}
                  onChange={(event) => setRangeStart(event.target.value)}
                  className="rounded-[18px] border border-[var(--line)] bg-white px-4 py-3 text-sm"
                />
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={(event) => setRangeEnd(event.target.value)}
                  className="rounded-[18px] border border-[var(--line)] bg-white px-4 py-3 text-sm"
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <article className="panel-card luxury-section p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
            Pagos
          </p>
          <p className="mt-4 text-4xl font-black">{paidOrdersCount}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Pedidos com pagamento confirmado dentro do periodo filtrado.
          </p>
        </article>
        <article className="panel-card luxury-section p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
            Pendentes
          </p>
          <p className="mt-4 text-4xl font-black">{pendingOrdersCount}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Pedidos aguardando confirmacao no atendimento.
          </p>
        </article>
        <article className="panel-card luxury-section p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
            Faturamento
          </p>
          <p className="mt-4 text-4xl font-black">{formatCurrency(totalRevenue)}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Total pago registrado no periodo selecionado.
          </p>
        </article>
        <article className="panel-card luxury-section p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
            Ticket medio
          </p>
          <p className="mt-4 text-4xl font-black">{formatCurrency(averageTicket)}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Media de venda considerando os pedidos pagos no periodo.
          </p>
        </article>
        <article className="panel-card luxury-section p-5 md:col-span-2 xl:col-span-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
                Historico rapido
              </p>
              <p className="mt-4 text-4xl font-black">{ordersInSelectedPeriod.length}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {deliveredOrdersCount} pedidos ja foram concluidos neste periodo.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-[22px] border border-[var(--line)] bg-white/80 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">
                    Pedido {order.orderNumberFormatted}
                  </p>
                  <p className="mt-2 text-sm font-bold">{order.customerName}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {order.displayTime} | {order.paymentStatus === "PAGO" ? "Pago" : "Pendente"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="flex w-full flex-col gap-4">
            <label className="relative block w-full max-w-md">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por cliente, telefone ou pedido"
                className="w-full rounded-full border border-[var(--line)] bg-white py-3 pl-11 pr-4 text-sm"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {[
                ["PENDENTES", `Pendentes (${pendingOrdersCount})`],
                ["PAGOS", `Pagos (${paidOrdersCount})`],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value as "PENDENTES" | "PAGOS")}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
                    filter === value
                      ? "bg-[var(--brand)] text-white"
                      : "glass-pill text-[var(--foreground)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="panel-subtle flex flex-col gap-3 rounded-[24px] p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">
                  Filtro por pagamento no historico
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Filtre a lista abaixo por Pix, dinheiro ou cartao.
                </p>
              </div>
              {(["TODOS", "PIX", "DINHEIRO", "CARTAO_CREDITO", "CARTAO_DEBITO"] as const).map(
                (value) => (
                  <div key={value} className="inline-flex">
                    <button
                      type="button"
                      onClick={() => setPaymentFilter(value)}
                      className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
                        paymentFilter === value
                          ? "bg-[var(--foreground)] text-white"
                          : "glass-pill text-[var(--foreground)]"
                      }`}
                    >
                      {value === "TODOS" ? "Todos pagamentos" : paymentLabels[value]}
                    </button>
                  </div>
                ),
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportVisibleOrdersCsv}
              disabled={filteredOrders.length === 0}
              className="glass-pill inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={() => void archiveVisibleOrders()}
              disabled={filteredOrders.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(179,63,47,0.2)] bg-[rgba(179,63,47,0.08)] px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              Arquivar filtro
            </button>
          </div>
        </div>
        {filteredOrders.length === 0 ? (
          <div className="panel-card luxury-section p-8 text-center text-sm text-[var(--muted)] xl:col-span-2">
            Nenhum pedido encontrado para esse filtro.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <article
              key={order.id}
              className={cn(
                "panel-card luxury-section relative overflow-hidden p-6",
                loadingId === order.id ? "opacity-75" : "",
                getWaitMinutes(order.createdAt) >= 15 && order.paymentStatus === "PENDENTE"
                  ? "border-[rgba(179,63,47,0.26)] shadow-[0_0_0_2px_rgba(179,63,47,0.08)]"
                  : order.paymentStatus === "PENDENTE"
                    ? "border-[rgba(184,68,31,0.18)]"
                    : "",
              )}
            >
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[color-mix(in_srgb,var(--accent)_32%,transparent)] blur-2xl" />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
                    Pedido {order.orderNumberFormatted}
                  </p>
                  <h2 className="mt-2 text-2xl font-black">{order.customerName}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {order.displayTime} | {paymentStatusLabels[order.paymentStatus]}
                  </p>
                  {Date.now() - new Date(order.createdAt).getTime() <= 8 * 60 * 1000 ? (
                    <p className="mt-2 inline-flex rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
                      Pedido novo
                    </p>
                  ) : null}
                  {getWaitMinutes(order.createdAt) >= 15 && order.paymentStatus === "PENDENTE" ? (
                    <p className="mt-2 inline-flex rounded-full bg-[rgba(179,63,47,0.12)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--danger)]">
                      Aguardando ha {getWaitMinutes(order.createdAt)} min
                    </p>
                  ) : null}
                </div>
                <span className="glass-pill rounded-full px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--foreground)]">
                  {paymentLabels[order.paymentMethod]}
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="panel-subtle p-4 text-sm leading-7 text-[var(--muted)]">
                  <p><strong className="text-[var(--foreground)]">Telefone:</strong> {order.phone}</p>
                  <p><strong className="text-[var(--foreground)]">Endereco:</strong> {order.address}, {order.houseNumber}</p>
                  {order.deliveryArea ? (
                    <p><strong className="text-[var(--foreground)]">Bairro:</strong> {order.deliveryArea}</p>
                  ) : null}
                  {order.reference ? (
                    <p><strong className="text-[var(--foreground)]">Referencia:</strong> {order.reference}</p>
                  ) : null}
                </div>

                <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(35,21,15,0.98),rgba(57,31,21,0.92))] p-4 text-white shadow-[0_18px_38px_rgba(35,21,15,0.18)]">
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
                <div className="glass-pill rounded-[18px] px-4 py-3">
                  <span className="text-sm text-[var(--muted)]">Total do pedido</span>
                  <strong className="ml-3 text-lg text-[var(--brand)]">{formatCurrency(order.total)}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => markAsPaid(order.id)}
                  disabled={loadingId === order.id || order.paymentStatus === "PAGO"}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_18px_30px_rgba(145,47,18,0.22)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[rgba(184,68,31,0.45)] disabled:shadow-none"
                >
                  <CheckCircle2 size={18} />
                  {loadingId === order.id
                    ? "Confirmando..."
                    : order.paymentStatus === "PAGO"
                      ? "Pagamento confirmado"
                      : "Confirmar pagamento"}
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
