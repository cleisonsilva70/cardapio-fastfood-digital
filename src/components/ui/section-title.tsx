type SectionTitleProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
};

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionTitleProps) {
  return (
    <div
      className={[
        "fade-rise",
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl text-left",
      ].join(" ")}
    >
      <span className="glass-pill inline-flex items-center gap-3 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--brand-strong)]">
        <span className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_0_6px_rgba(255,191,71,0.18)]" />
        {eyebrow}
      </span>
      <h2 className="mt-5 text-3xl font-black uppercase tracking-[-0.03em] text-[var(--foreground)] sm:text-4xl lg:text-[2.8rem]">
        {title}
      </h2>
      <div
        className={[
          "mt-4 h-1.5 rounded-full bg-[linear-gradient(90deg,var(--brand),var(--accent))]",
          align === "center" ? "mx-auto w-28" : "w-24",
        ].join(" ")}
      />
      <p
        className={[
          "mt-5 text-base leading-7 text-[var(--muted)] sm:text-[1.02rem]",
          align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl",
        ].join(" ")}
      >
        {description}
      </p>
    </div>
  );
}
