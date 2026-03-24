import Image from "next/image";
import { getResolvedPromoBanners } from "@/lib/white-label";

export async function PromoBanners() {
  const banners = await getResolvedPromoBanners();

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="container-shell mt-10">
      <div className="grid gap-6 lg:grid-cols-2">
        {banners.map((banner) => (
          <article
            key={banner.id}
            className="panel-card group overflow-hidden border border-[var(--line)]"
          >
            <div className="relative h-56">
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(20,11,7,0.85)] via-[rgba(20,11,7,0.46)] to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                  Banner promocional
                </p>
                <h3 className="mt-3 max-w-xl text-3xl font-black uppercase leading-[0.95]">
                  {banner.title}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/85">
                  {banner.description}
                </p>
                <span className="mt-5 inline-flex w-fit rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--foreground)] shadow-[0_16px_34px_rgba(0,0,0,0.18)]">
                  {banner.ctaLabel}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
