import Image from "next/image";
import Link from "next/link";
import { Clock3, Phone } from "lucide-react";
import { getResolvedStoreConfig } from "@/lib/white-label";

export async function BrandHeader() {
  const store = await getResolvedStoreConfig();

  return (
    <header className="container-shell pt-5 sm:pt-6">
      <div className="luxury-section relative overflow-hidden rounded-[32px] border border-[rgba(70,37,17,0.08)] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,244,228,0.8))] px-5 py-5 shadow-[0_18px_45px_rgba(73,38,18,0.1)] sm:px-7 sm:py-6">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] bg-[radial-gradient(circle_at_top_right,rgba(255,191,71,0.22),transparent_52%),radial-gradient(circle_at_70%_60%,rgba(184,68,31,0.1),transparent_44%)] lg:block" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
          {store.logoPath ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-[22px] border border-[var(--line)] bg-white shadow-[0_12px_24px_rgba(55,26,12,0.08)]">
              <Image
                src={store.logoPath}
                alt={store.shortName}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] text-lg font-black uppercase text-white shadow-[0_16px_28px_rgba(145,47,18,0.28)]">
              {store.logoText}
            </div>
          )}
            <div>
              <span className="glass-pill inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--brand-strong)]">
                Operacao delivery
              </span>
              <Link href="/" className="mt-3 block text-2xl font-black uppercase leading-none tracking-[-0.04em] sm:text-[2rem]">
                {store.name}
              </Link>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-[0.96rem]">
                Cardapio digital, atendimento por WhatsApp e fluxo interno preparado
                para balconista e cozinha.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[430px]">
            <div className="glass-pill rounded-[24px] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--brand-strong)]">
                Contato da loja
              </p>
              <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <Phone size={16} />
                <span>{store.phoneDisplay}</span>
              </div>
            </div>
            <div className="glass-pill rounded-[24px] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--brand-strong)]">
                Horario de pedido
              </p>
              <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <Clock3 size={16} />
                <span>{store.openingHours}</span>
              </div>
            </div>
            <div className="rounded-[24px] border border-[rgba(34,19,13,0.08)] bg-[var(--surface-dark)] px-4 py-3 text-white sm:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/55">
                Fluxo operacional
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5">
                  Cliente pede
                </span>
                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5">
                  Atendimento confirma
                </span>
                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5">
                  Cozinha produz
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
