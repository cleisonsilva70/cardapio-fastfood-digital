import Image from "next/image";
import Link from "next/link";
import { Clock3, Phone } from "lucide-react";
import { getResolvedStoreConfig } from "@/lib/white-label";

export async function BrandHeader() {
  const store = await getResolvedStoreConfig();

  return (
    <header className="container-shell pt-5">
      <div className="flex flex-col gap-4 rounded-[26px] border border-[var(--line)] bg-white/75 px-5 py-4 shadow-[0_12px_30px_rgba(73,38,18,0.08)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {store.logoPath ? (
            <div className="relative h-14 w-14 overflow-hidden rounded-[18px] border border-[var(--line)] bg-white">
              <Image
                src={store.logoPath}
                alt={store.shortName}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[var(--brand)] text-lg font-black uppercase text-white">
              {store.logoText}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
              Pedidos online
            </p>
            <Link href="/" className="mt-1 block text-2xl font-black uppercase">
              {store.name}
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:gap-6">
          <div className="inline-flex items-center gap-2">
            <Phone size={16} />
            <span>{store.phoneDisplay}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Clock3 size={16} />
            <span>{store.openingHours}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
