import { listProducts } from "@/lib/order-repository";
import { getResolvedPromoBanners } from "@/lib/white-label";
import { PromoBannersClient } from "./promo-banners-client";

export async function PromoBanners() {
  const [banners, products] = await Promise.all([
    getResolvedPromoBanners(),
    listProducts(),
  ]);

  if (banners.length === 0) {
    return null;
  }

  return <PromoBannersClient banners={banners} products={products} />;
}
