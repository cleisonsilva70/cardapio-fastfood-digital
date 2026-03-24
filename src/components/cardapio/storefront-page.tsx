import Link from "next/link";
import { MapPin, MessageCircle, ShoppingBag } from "lucide-react";
import { PromoBanners } from "@/components/home/promo-banners";
import { formatDeliveryEstimate } from "@/lib/delivery";
import { formatCurrency } from "@/lib/format";
import { listProducts } from "@/lib/order-repository";
import { getResolvedStoreConfig } from "@/lib/white-label";
import { MenuClient } from "./menu-client";

export async function StorefrontPage() {
  const [products, store] = await Promise.all([
    listProducts(),
    getResolvedStoreConfig(),
  ]);

  return (
    <main className="pb-16">
      <section className="container-shell py-4 sm:py-6">
        <div className="panel-card overflow-hidden p-5 sm:p-7 lg:p-8">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
                Pedido online da loja
              </p>
              <h1 className="mt-3 max-w-4xl text-3xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">
                Cardapio digital pronto para fechar pedido rapido
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
                Escolha seus burgers, combos, bebidas e adicionais. Monte o
                carrinho e envie o pedido direto para o WhatsApp da hamburgueria.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-4 py-3 text-sm font-semibold text-[var(--muted)]">
                  <MessageCircle size={16} className="text-[var(--brand)]" />
                  <span>{store.phoneDisplay}</span>
                </div>
                <div className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-4 py-3 text-sm font-semibold text-[var(--muted)]">
                  <MapPin size={16} className="text-[var(--brand)]" />
                  <span>{store.address}</span>
                </div>
                <div className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-4 py-3 text-sm font-semibold text-[var(--muted)]">
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
            </div>

            <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
                Acesso rapido
              </p>
              <div className="mt-4 space-y-4">
                <div className="rounded-[22px] bg-white/90 p-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand)] text-white">
                    <ShoppingBag size={20} />
                  </div>
                  <h2 className="mt-4 text-xl font-black uppercase">
                    Pedido pelo celular
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    O cliente escolhe os itens, preenche a entrega e envia tudo
                    para o WhatsApp em poucos passos.
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-strong)]">
                    {store.deliveryAreas.length > 0
                      ? `${store.deliveryAreas.length} bairros configurados com taxa e prazo`
                      : "Taxa padrao e previsao editaveis para cada cliente"}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/checkout"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--foreground)] px-5 py-3 text-center text-sm font-bold uppercase tracking-[0.14em] text-white"
                  >
                    Ir para checkout
                  </Link>
                  <Link
                    href={`https://wa.me/${store.whatsappNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 py-3 text-center text-sm font-bold uppercase tracking-[0.14em]"
                  >
                    WhatsApp da loja
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PromoBanners />
      <MenuClient products={products} />
    </main>
  );
}
