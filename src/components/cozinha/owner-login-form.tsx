"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OwnerLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Senha invalida.");
        return;
      }

      router.push("/cozinha");
      router.refresh();
    } catch {
      setError("Nao foi possivel entrar agora.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
      <section className="panel-card luxury-section overflow-hidden p-8 sm:p-10">
        <p className="glass-pill inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
          Area restrita
        </p>
        <h1 className="mt-4 text-4xl font-black uppercase tracking-[-0.04em] sm:text-5xl">
          Entrada da equipe da loja
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Este acesso libera atendimento, cozinha e painel interno. Use a senha
          do proprietario para continuar com seguranca.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            "Triagem do atendimento",
            "Liberacao manual para cozinha",
            "Atualizacao rapida do pedido",
          ].map((item) => (
            <div
              key={item}
              className="panel-subtle fade-rise p-4 text-sm font-semibold leading-6 text-[var(--foreground)]"
            >
              {item}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[28px] border border-[rgba(34,19,13,0.08)] bg-[linear-gradient(180deg,var(--surface-dark),#1b100b)] p-5 text-white shadow-[0_20px_38px_rgba(34,19,13,0.18)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/55">
            Fluxo interno
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["1", "Atendimento recebe"],
              ["2", "Pagamento confirmado"],
              ["3", "Cozinha produz"],
            ].map(([step, label]) => (
              <div key={step} className="rounded-[20px] border border-white/10 bg-white/8 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                  Etapa {step}
                </p>
                <p className="mt-2 text-sm font-bold uppercase leading-5">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="panel-card luxury-section overflow-hidden p-8 sm:p-10">
        <div className="float-soft inline-flex h-14 w-14 items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] text-xl font-black uppercase text-white shadow-[0_18px_30px_rgba(145,47,18,0.22)]">
          OP
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
          Login
        </p>
        <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.03em]">
          Entrar agora
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Digite a senha para abrir as telas internas da operacao.
        </p>

        <label className="mt-8 block space-y-2">
          <span className="text-sm font-semibold">Senha do proprietario</span>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Digite a senha de acesso"
            className="w-full rounded-2xl border border-[var(--line)] bg-white/88 px-4 py-3 outline-none transition-colors focus:border-[var(--brand)]"
          />
        </label>

        {error ? (
          <p className="mt-5 rounded-2xl border border-[rgba(179,63,47,0.22)] bg-[rgba(179,63,47,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="pulse-glow mt-6 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,rgba(184,68,31,1),rgba(145,47,18,1))] px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition-colors hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[rgba(184,68,31,0.45)] disabled:shadow-none"
        >
          {isSubmitting ? "Entrando..." : "Entrar na operacao"}
        </button>
      </form>
    </div>
  );
}
