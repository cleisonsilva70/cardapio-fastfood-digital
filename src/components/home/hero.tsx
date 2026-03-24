import Link from "next/link";
import { ArrowRight, Flame, MessageCircleMore } from "lucide-react";
import { getResolvedBrandingConfig, getResolvedStoreConfig } from "@/lib/white-label";

export async function Hero() {
  const [branding, store] = await Promise.all([
    getResolvedBrandingConfig(),
    getResolvedStoreConfig(),
  ]);

  return (
    <section className="container-shell py-8 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel-card overflow-hidden p-6 sm:p-8 lg:p-10">
          <span className="inline-flex rounded-full border border-[var(--line)] bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brand-strong)]">
            {branding.eyebrow}
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">
            {branding.heroTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
            {branding.heroDescription}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cardapio"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[var(--brand-strong)]"
            >
              Ver cardapio
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="panel-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]">
                <MessageCircleMore size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
                  Pedido simples
                </p>
                <h2 className="mt-1 text-2xl font-black">{store.name}</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              O cliente escolhe no cardápio, preenche os dados e o sistema abre a conversa com a mensagem pronta, número sequencial e total calculado.
            </p>
          </div>

          <div className="panel-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--foreground)] text-white">
                <Flame size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
                  Operacao enxuta
                </p>
                <h2 className="mt-1 text-2xl font-black">Painel estilo Kanban</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              {branding.tagline}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
