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
    <div className={align === "center" ? "text-center" : "text-left"}>
      <span className="inline-flex rounded-full border border-[var(--line)] bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brand-strong)]">
        {eyebrow}
      </span>
      <h2 className="mt-5 text-3xl font-black uppercase tracking-tight text-[var(--foreground)] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
        {description}
      </p>
    </div>
  );
}
