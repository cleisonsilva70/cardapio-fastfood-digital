import type { CSSProperties } from "react";
import bannersData from "../../data/banners.json";
import brandingData from "../../data/branding.json";
import productsData from "../../data/products.json";
import storeData from "../../data/store.json";
import { parseDeliveryAreasJson } from "./delivery";
import { prisma } from "./prisma";
import type { DeliveryAreaRule, PaymentMethod, Product } from "./types";

export type StoreConfig = {
  name: string;
  shortName: string;
  slug: string;
  logoText: string;
  logoPath: string;
  whatsappNumber: string;
  phoneDisplay: string;
  address: string;
  openingHours: string;
  deliveryFee: number;
  estimatedDeliveryMin: number;
  estimatedDeliveryMax: number;
  deliveryAreas: DeliveryAreaRule[];
  payments: PaymentMethod[];
  kitchenPasswordHint: string;
};

export type BrandingConfig = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceColor: string;
  heroTitle: string;
  heroDescription: string;
  eyebrow: string;
  tagline: string;
};

export type PromoBanner = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaLabel: string;
  active?: boolean;
};

export function getStoreConfig() {
  return storeData as StoreConfig;
}

export function getBrandingConfig() {
  return brandingData as BrandingConfig;
}

export function getPromoBanners() {
  return bannersData as PromoBanner[];
}

export function getCatalogProducts() {
  return productsData as Product[];
}

export function getCurrentStoreSlug() {
  return getStoreConfig().slug;
}

export async function getResolvedStoreConfig() {
  const fallback = getStoreConfig();

  if (!process.env.DATABASE_URL) {
    return fallback;
  }

  const store = await prisma.store.findUnique({
    where: { slug: fallback.slug },
    include: { settings: true },
  });

  if (!store?.settings) {
    return fallback;
  }

  const deliveryAreas = parseDeliveryAreasJson(store.settings.deliveryAreasJson);

  return {
    ...fallback,
    name: store.name,
    shortName: store.settings.shortName,
    logoText: store.settings.logoText,
    logoPath: store.settings.logoPath ?? fallback.logoPath,
    whatsappNumber: store.settings.whatsappNumber,
    phoneDisplay: store.settings.phoneDisplay,
    address: store.settings.address,
    openingHours: store.settings.openingHours,
    deliveryFee: Number(store.settings.defaultDeliveryFee ?? fallback.deliveryFee),
    estimatedDeliveryMin:
      store.settings.estimatedDeliveryMin ?? fallback.estimatedDeliveryMin,
    estimatedDeliveryMax:
      store.settings.estimatedDeliveryMax ?? fallback.estimatedDeliveryMax,
    deliveryAreas: deliveryAreas.length > 0 ? deliveryAreas : fallback.deliveryAreas,
  };
}

export async function getResolvedBrandingConfig() {
  const fallback = getBrandingConfig();

  if (!process.env.DATABASE_URL) {
    return fallback;
  }

  const store = await prisma.store.findUnique({
    where: { slug: getCurrentStoreSlug() },
    include: { settings: true },
  });

  if (!store?.settings) {
    return fallback;
  }

  return {
    ...fallback,
    primaryColor: store.settings.primaryColor,
    secondaryColor: store.settings.secondaryColor,
    accentColor: store.settings.accentColor,
    surfaceColor: store.settings.surfaceColor ?? fallback.surfaceColor,
    eyebrow: store.settings.eyebrow,
    heroTitle: store.settings.heroTitle,
    heroDescription: store.settings.heroDescription,
    tagline: store.settings.tagline,
  };
}

export async function getResolvedPromoBanners() {
  const fallback = getPromoBanners();

  if (!process.env.DATABASE_URL) {
    return fallback;
  }

  const store = await prisma.store.findUnique({
    where: { slug: getCurrentStoreSlug() },
    select: { id: true },
  });

  if (!store) {
    return fallback;
  }

  const banners = await prisma.storeBanner.findMany({
    where: {
      storeId: store.id,
      active: true,
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });

  if (banners.length === 0) {
    return fallback;
  }

  return banners.map((banner) => ({
    id: banner.id,
    title: banner.title,
    description: banner.description,
    imageUrl: banner.imageUrl,
    ctaLabel: banner.ctaLabel,
    active: banner.active,
  }));
}

export function getThemeStyleVariables(branding = getBrandingConfig()) {

  return {
    "--brand": branding.primaryColor,
    "--brand-strong": branding.accentColor,
    "--accent": branding.secondaryColor,
    "--surface": branding.surfaceColor,
  } as CSSProperties;
}
