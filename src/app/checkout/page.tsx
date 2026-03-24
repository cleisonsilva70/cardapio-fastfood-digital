import Link from "next/link";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getResolvedStoreConfig } from "@/lib/white-label";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const store = await getResolvedStoreConfig();

  return (
    <main className="container-shell py-8 pb-16 sm:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
            Finalizacao
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase">Concluir pedido</h1>
        </div>
        <Link
          href="/"
          className="rounded-full border border-[var(--line)] bg-white/70 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em]"
        >
          Voltar ao cardapio
        </Link>
      </div>

      <CheckoutForm
        deliveryFee={store.deliveryFee ?? 0}
        estimatedDeliveryMin={store.estimatedDeliveryMin ?? 0}
        estimatedDeliveryMax={store.estimatedDeliveryMax ?? 0}
        deliveryAreas={store.deliveryAreas ?? []}
      />
    </main>
  );
}
