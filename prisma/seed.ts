import { PrismaClient, ProductCategory } from "@prisma/client";
import branding from "../data/branding.json";
import productsData from "../data/products.json";
import store from "../data/store.json";

const prisma = new PrismaClient();

const products = productsData.map((product, index) => ({
  ...product,
  category: product.category as ProductCategory,
  displayOrder: index + 1,
}));

async function main() {
  const tenant = await prisma.store.upsert({
    where: { slug: store.slug },
    update: {
      name: store.name,
      status: "ACTIVE",
    },
    create: {
      name: store.name,
      slug: store.slug,
      status: "ACTIVE",
    },
  });

  await prisma.storeSettings.upsert({
    where: { storeId: tenant.id },
    update: {
      whatsappNumber: store.whatsappNumber,
      phoneDisplay: store.phoneDisplay,
      address: store.address,
      openingHours: store.openingHours,
      defaultDeliveryFee: store.deliveryFee ?? 0,
      estimatedDeliveryMin: store.estimatedDeliveryMin ?? 30,
      estimatedDeliveryMax: store.estimatedDeliveryMax ?? 45,
      deliveryAreasJson: JSON.stringify(store.deliveryAreas ?? []),
      shortName: store.shortName,
      logoText: store.logoText,
      logoPath: store.logoPath || null,
      heroTitle: store.name,
      heroDescription: branding.heroDescription,
      eyebrow: branding.eyebrow,
      tagline: branding.tagline,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      accentColor: branding.accentColor,
      surfaceColor: branding.surfaceColor,
    },
    create: {
      storeId: tenant.id,
      whatsappNumber: store.whatsappNumber,
      phoneDisplay: store.phoneDisplay,
      address: store.address,
      openingHours: store.openingHours,
      defaultDeliveryFee: store.deliveryFee ?? 0,
      estimatedDeliveryMin: store.estimatedDeliveryMin ?? 30,
      estimatedDeliveryMax: store.estimatedDeliveryMax ?? 45,
      deliveryAreasJson: JSON.stringify(store.deliveryAreas ?? []),
      shortName: store.shortName,
      logoText: store.logoText,
      logoPath: store.logoPath || null,
      heroTitle: store.name,
      heroDescription: branding.heroDescription,
      eyebrow: branding.eyebrow,
      tagline: branding.tagline,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      accentColor: branding.accentColor,
      surfaceColor: branding.surfaceColor,
    },
  });

  const banners = (await import("../data/banners.json")).default;

  for (const [index, banner] of banners.entries()) {
    await prisma.storeBanner.upsert({
      where: { id: banner.id },
      update: {
        storeId: tenant.id,
        title: banner.title,
        description: banner.description,
        imageUrl: banner.imageUrl,
        ctaLabel: banner.ctaLabel,
        active: true,
        displayOrder: index + 1,
      },
      create: {
        id: banner.id,
        storeId: tenant.id,
        title: banner.title,
        description: banner.description,
        imageUrl: banner.imageUrl,
        ctaLabel: banner.ctaLabel,
        active: true,
        displayOrder: index + 1,
      },
    });
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        storeId: tenant.id,
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
        featured: product.featured,
        active: true,
        displayOrder: product.displayOrder,
      },
      create: {
        ...product,
        storeId: tenant.id,
        active: true,
      },
    });
  }

  await prisma.orderCounter.upsert({
    where: { key: "orders" },
    update: {},
    create: {
      key: "orders",
      value: 0,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
