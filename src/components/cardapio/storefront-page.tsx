import Image from "next/image";
import Link from "next/link";
import { Clock3, MapPin, MessageCircle, ShoppingBag } from "lucide-react";
import { PromoBanners } from "@/components/home/promo-banners";
import { formatDeliveryEstimate } from "@/lib/delivery";
import { formatCurrency } from "@/lib/format";
import { isInlineImage } from "@/lib/image-reference";
import { listProducts, listStoreCategories } from "@/lib/order-repository";
import { getResolvedStoreConfig } from "@/lib/white-label";
import { MenuClient } from "./menu-client";

export async function StorefrontPage() {
  const [products, categories, store] = await Promise.all([
    listProducts(),
    listStoreCategories(),
    getResolvedStoreConfig(),
  ]);

  return (
    <main className="pb-16">
      <section className="container-shell py-4 sm:py-6">
        <div className="panel-card luxury-section overflow-hidden p-5 sm:p-7 lg:p-8">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                {store.logoPath ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-[22px] border border-[var(--line)] bg-white shadow-[0_14px_28px_rgba(55,26,12,0.08)]">
                    <Image
                      src={store.logoPath}
                      alt={store.shortName}
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized={isInlineImage(store.logoPath)}
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] text-xl font-black uppercase text-white shadow-[0_14px_28px_rgba(145,47,18,0.24)]">
                    {store.logoText}
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--brand-strong)]">
                    Pedido online oficial
                  </p>
                  <h1 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] sm:text-[2.2rem]">
                    {store.name}
                  </h1>
                </div>
              </div>

              <h2 className="mt-6 max-w-4xl text-3xl font-black uppercase leading-[0.92] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                Peca seus favoritos sem fila e sem complicacao
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
                Escolha seus burgers, combos e bebidas, confira a entrega e envie o
                pedido para a loja em poucos toques.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="glass-pill inline-flex min-h-12 items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--muted)]">
                  <MessageCircle size={16} className="text-[var(--brand)]" />
                  <span>{store.phoneDisplay}</span>
                </div>
                <div className="glass-pill inline-flex min-h-12 items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--muted)]">
                  <MapPin size={16} className="text-[var(--brand)]" />
                  <span>{store.address}</span>
                </div>
                <div className="glass-pill inline-flex min-h-12 items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-[var(--muted)]">
                  <ShoppingBag size={16} className="text-[var(--brand)]" />
                  <span>
                    Entrega a partir de {formatCurrency(store.deliveryFee)} |{" "}
                    {formatDeliveryEstimate(
                      store.estimatedDeliveryMin,
                      store.estimatedDeliveryMax,
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="#cardapio"
                  className="inline-flex min-h-13 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] px-7 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-[var(--surface)] shadow-[0_18px_30px_rgba(145,47,18,0.22)] ring-1 ring-[rgba(255,255,255,0.14)]"
                >
                  Escolher produtos
                </Link>
              </div>
            </div>

            <div className="dashboard-grid overflow-hidden rounded-[28px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(35,21,15,0.96),rgba(57,31,21,0.92))] p-5 text-white sm:p-6">
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                  Como funciona
                </p>
                <div className="mt-4 space-y-4">
                  <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--foreground)]">
                      <ShoppingBag size={20} />
                    </div>
                    <h2 className="mt-4 text-xl font-black uppercase">
                      Seu pedido em poucos passos
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/74">
                      Escolha os itens, informe a entrega e confirme. O pedido chega
                      para a loja no WhatsApp e segue para atendimento.
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                      {store.deliveryAreas.length > 0
                        ? `${store.deliveryAreas.length} bairros configurados com taxa e prazo`
                        : "Taxa padrao e previsao editaveis para cada cliente"}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      ["1", "Escolha seus itens"],
                      ["2", "Confirme a entrega"],
                      ["3", "Envie para a loja"],
                    ].map(([step, label]) => (
                      <div
                        key={step}
                        className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                          Etapa {step}
                        </p>
                        <p className="mt-2 text-sm font-bold uppercase leading-5">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                        Horario
                      </p>
                      <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold">
                        <Clock3 size={15} className="text-[var(--accent)]" />
                        <span>{store.openingHours}</span>
                      </div>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                        Entrega
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white/85">
                        {formatDeliveryEstimate(
                          store.estimatedDeliveryMin,
                          store.estimatedDeliveryMax,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PromoBanners />

      <MenuClient products={products} categories={categories} />
    </main>
  );
}
