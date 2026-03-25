import { prisma } from "./prisma";
import { buildMockPaymentCode } from "./payment";
import {
  buildCustomizationText,
  parseOptionalItemsText,
  parseSizeOptionsText,
  stringifyOptionalItems,
  stringifySizeOptions,
} from "./product-customization";
import { buildOrderMessage, buildWhatsAppUrl } from "./whatsapp";
import {
  formatDeliveryAreasText,
  parseDeliveryAreasJson,
  parseDeliveryAreasText,
} from "./delivery";
import { formatOrderNumber, formatTimeLabel } from "./format";
import {
  getCatalogProducts,
  getCurrentStoreSlug,
  getResolvedStoreConfig,
  type StoreConfig,
} from "./white-label";
import type {
  CartItem,
  CheckoutInput,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Product,
  StoreCategory,
} from "./types";

const memoryOrders: Order[] = [];
const products = getCatalogProducts();

async function getCurrentStoreId() {
  const store = await prisma.store.findUnique({
    where: { slug: getCurrentStoreSlug() },
    select: { id: true },
  });

  return store?.id ?? null;
}

export class OrderFlowError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = "OrderFlowError";
  }
}

type PersistedOrderItem = {
  id: string;
  productId: string | null;
  cartItemId?: string | null;
  productName: string;
  category: string;
  unitPrice: { toString(): string } | number;
  quantity: number;
  customizationText?: string | null;
  subtotal: { toString(): string } | number;
};

type PersistedOrder = {
  id: string;
  orderNumber: number;
  orderNumberFormatted: string;
  customerName: string;
  phone: string;
  address: string;
  houseNumber: string;
  deliveryArea?: string | null;
  reference: string | null;
  customerNote?: string | null;
  paymentMethod: Order["paymentMethod"];
  paymentStatus: PaymentStatus;
  paymentProvider: string | null;
  paymentExternalId: string | null;
  paymentLink: string | null;
  paymentCode: string | null;
  paymentConfirmedAt: Date | null;
  kitchenClearedAt: Date | null;
  archivedAt: Date | null;
  subtotal: { toString(): string } | number;
  deliveryFee: { toString(): string } | number;
  estimatedDeliveryMin?: number | null;
  estimatedDeliveryMax?: number | null;
  total: { toString(): string } | number;
  orderText: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  items: PersistedOrderItem[];
};

type RequestedCartItem = {
  id: CartItem["id"];
  quantity: CartItem["quantity"];
  cartItemId?: CartItem["cartItemId"];
  selectedSizeId?: CartItem["selectedSizeId"];
  selectedOptionalItemIds?: CartItem["selectedOptionalItemIds"];
  customerNote?: CartItem["customerNote"];
};

type ResolvedCartItem = CartItem;

function normalizeCategoryName(value: string) {
  return value.trim();
}

function parseSizeOptionsJson(value?: string | null) {
  if (!value) {
    return [];
  }

  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function parseOptionalItemsJson(value?: string | null) {
  if (!value) {
    return [];
  }

  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function sortProductsByCategories<T extends { category: string; name: string; displayOrder?: number }>(
  items: T[],
  categories: StoreCategory[],
) {
  const categoryOrder = new Map(
    categories.map((category) => [normalizeCategoryName(category.name), category.displayOrder]),
  );

  return [...items].sort((left, right) => {
    const leftCategoryOrder =
      categoryOrder.get(normalizeCategoryName(left.category)) ?? Number.MAX_SAFE_INTEGER;
    const rightCategoryOrder =
      categoryOrder.get(normalizeCategoryName(right.category)) ?? Number.MAX_SAFE_INTEGER;

    if (leftCategoryOrder !== rightCategoryOrder) {
      return leftCategoryOrder - rightCategoryOrder;
    }

    const leftDisplayOrder = left.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const rightDisplayOrder = right.displayOrder ?? Number.MAX_SAFE_INTEGER;

    if (leftDisplayOrder !== rightDisplayOrder) {
      return leftDisplayOrder - rightDisplayOrder;
    }

    return left.name.localeCompare(right.name, "pt-BR");
  });
}

function mapItems(items: CartItem[]): OrderItem[] {
  return items.map((item) => ({
    id: item.cartItemId || `${item.id}-${Math.random().toString(16).slice(2, 8)}`,
    productId: item.id,
    cartItemId: item.cartItemId,
    productName: item.name,
    category: item.category,
    unitPrice: item.price,
    quantity: item.quantity,
    customizationText: item.customizationText,
    subtotal: item.subtotal,
  }));
}

function toOrder(params: {
  id: string;
  orderNumber: number;
  checkout: CheckoutInput;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  estimatedDeliveryMin: number;
  estimatedDeliveryMax: number;
  total: number;
  orderText: string;
  paymentStatus?: PaymentStatus;
  paymentProvider?: string;
  paymentExternalId?: string;
  paymentLink?: string;
  paymentCode?: string;
  paymentConfirmedAt?: Date;
  kitchenClearedAt?: Date;
  archivedAt?: Date;
  status?: OrderStatus;
  createdAt?: Date;
  updatedAt?: Date;
}): Order {
  const createdAt = params.createdAt ?? new Date();
  const updatedAt = params.updatedAt ?? createdAt;

  return {
    id: params.id,
    orderNumber: params.orderNumber,
    orderNumberFormatted: formatOrderNumber(params.orderNumber),
    customerName: params.checkout.customerName,
    phone: params.checkout.phone,
    address: params.checkout.address,
  houseNumber: params.checkout.houseNumber,
  deliveryArea: params.checkout.deliveryArea,
  reference: params.checkout.reference,
  customerNote: params.checkout.customerNote,
  paymentMethod: params.checkout.paymentMethod,
    paymentStatus: params.paymentStatus ?? "PENDENTE",
    paymentProvider: params.paymentProvider,
    paymentExternalId: params.paymentExternalId,
    paymentLink: params.paymentLink,
    paymentCode: params.paymentCode,
    paymentConfirmedAt: params.paymentConfirmedAt?.toISOString(),
    kitchenClearedAt: params.kitchenClearedAt?.toISOString(),
    archivedAt: params.archivedAt?.toISOString(),
    subtotal: params.subtotal,
    deliveryFee: params.deliveryFee,
    estimatedDeliveryMin: params.estimatedDeliveryMin,
    estimatedDeliveryMax: params.estimatedDeliveryMax,
    total: params.total,
    orderText: params.orderText,
    status: params.status ?? "NOVO",
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    displayTime: formatTimeLabel(createdAt),
    items: mapItems(params.items),
  };
}

function sortOrders(orders: Order[]) {
  return [...orders].sort((a, b) => b.orderNumber - a.orderNumber);
}

function isDemoModeEnabled() {
  return process.env.ALLOW_DEMO_MODE === "true";
}

function assertOrderStorageAvailable() {
  if (!canUseDatabase() && !isDemoModeEnabled()) {
    throw new OrderFlowError(
      "Pedidos desabilitados no momento. Configure o banco de dados ou ative o modo demo local.",
      503,
    );
  }
}

async function resolveCartItems(items: RequestedCartItem[]): Promise<ResolvedCartItem[]> {
  const availableProducts = (await listProducts()) as Product[];
  const productCatalog = new Map(
    availableProducts.map((product: Product) => [product.id, product]),
  );

  return items.map((item) => {
    const product = productCatalog.get(item.id);

    if (!product) {
      throw new OrderFlowError("Um dos produtos enviados nao existe mais no cardapio.", 400);
    }

    const selectedSize = product.sizeOptions?.find((option) => option.id === item.selectedSizeId);
    const selectedOptionalItems = (product.optionalItems ?? []).filter((option) =>
      (item.selectedOptionalItemIds ?? []).includes(option.id),
    );
    const selectedOptionalItemTotal = selectedOptionalItems.reduce(
      (acc, option) => acc + option.price,
      0,
    );
    const unitPrice =
      product.price + (selectedSize?.priceDelta ?? 0) + selectedOptionalItemTotal;
    const customizationText = buildCustomizationText({
      sizeLabel: selectedSize?.label,
      optionalLabels: selectedOptionalItems.map((option) => option.label),
      customerNote: item.customerNote,
    });

    return {
      ...product,
      cartItemId:
        item.cartItemId ??
        `${product.id}-${Math.random().toString(16).slice(2, 10)}`,
      selectedSizeId: selectedSize?.id,
      selectedSizeLabel: selectedSize?.label,
      selectedSizePriceDelta: selectedSize?.priceDelta ?? 0,
      selectedOptionalItemIds: selectedOptionalItems.map((option) => option.id),
      selectedOptionalItemLabels: selectedOptionalItems.map((option) => option.label),
      selectedOptionalItemTotal,
      customerNote: item.customerNote?.trim() || "",
      customizationText,
      quantity: item.quantity,
      price: unitPrice,
      subtotal: unitPrice * item.quantity,
    };
  });
}

function resolveDeliverySettings(store: StoreConfig, checkout: CheckoutInput) {
  const activeAreas = store.deliveryAreas.filter((area) => area.active !== false);

  if (activeAreas.length > 0) {
    const selectedArea = activeAreas.find((area) => area.id === checkout.deliveryArea);

    if (!selectedArea) {
      throw new OrderFlowError(
        "Selecione um bairro de entrega valido antes de enviar o pedido.",
        400,
      );
    }

    return {
      deliveryArea: selectedArea.name,
      deliveryFee: selectedArea.fee,
      estimatedDeliveryMin: selectedArea.estimatedDeliveryMin,
      estimatedDeliveryMax: selectedArea.estimatedDeliveryMax,
    };
  }

  return {
    deliveryArea: checkout.deliveryArea,
    deliveryFee: store.deliveryFee ?? 0,
    estimatedDeliveryMin: store.estimatedDeliveryMin ?? 0,
    estimatedDeliveryMax: store.estimatedDeliveryMax ?? store.estimatedDeliveryMin ?? 0,
  };
}

function mapPersistedOrder(order: PersistedOrder): Order {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderNumberFormatted: order.orderNumberFormatted,
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    houseNumber: order.houseNumber,
    deliveryArea: order.deliveryArea ?? undefined,
    reference: order.reference ?? undefined,
    customerNote: order.customerNote ?? undefined,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentProvider: order.paymentProvider ?? undefined,
    paymentExternalId: order.paymentExternalId ?? undefined,
    paymentLink: order.paymentLink ?? undefined,
    paymentCode: order.paymentCode ?? undefined,
    paymentConfirmedAt: order.paymentConfirmedAt?.toISOString(),
    kitchenClearedAt: order.kitchenClearedAt?.toISOString(),
    archivedAt: order.archivedAt?.toISOString(),
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    estimatedDeliveryMin: order.estimatedDeliveryMin ?? undefined,
    estimatedDeliveryMax: order.estimatedDeliveryMax ?? undefined,
    total: Number(order.total),
    orderText: order.orderText,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    displayTime: formatTimeLabel(order.createdAt),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId ?? undefined,
      cartItemId: item.cartItemId ?? undefined,
      productName: item.productName,
      category: item.category as OrderItem["category"],
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      customizationText: item.customizationText ?? undefined,
      subtotal: Number(item.subtotal),
    })),
  };
}

function canUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

async function getNextOrderNumber() {
  if (!canUseDatabase()) {
    return (memoryOrders[0]?.orderNumber ?? 0) + 1;
  }

  const lastOrder = await prisma.order.findFirst({
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  return (lastOrder?.orderNumber ?? 0) + 1;
}

export async function listProducts() {
  if (!process.env.DATABASE_URL) {
    return products;
  }

  const storeId = await getCurrentStoreId();

  if (!storeId) {
    return products;
  }

  const [persistedProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        storeId,
        active: true,
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    listStoreCategories(),
  ]);

  if (persistedProducts.length === 0) {
    return products;
  }

  return sortProductsByCategories(persistedProducts, categories).map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    imageUrl: product.imageUrl,
    category: product.category,
    featured: product.featured,
    compositionText: product.compositionText ?? "",
    sizeOptions: parseSizeOptionsJson(product.sizeOptionsJson),
    optionalItems: parseOptionalItemsJson(product.optionalItemsJson),
    allowCustomerNote: product.allowCustomerNote,
  }));
}

export async function listOrders() {
  if (!canUseDatabase()) {
    return sortOrders(memoryOrders.filter((order) => !order.archivedAt));
  }

  const storeId = await getCurrentStoreId();

  if (!storeId) {
    return [];
  }

  const orders = (await prisma.order.findMany({
    where: {
      storeId,
      archivedAt: null,
    },
    include: { items: true },
    orderBy: { orderNumber: "desc" },
  })) as PersistedOrder[];

  return orders.map(mapPersistedOrder);
}

export async function listKitchenOrders() {
  if (!canUseDatabase()) {
    return sortOrders(
      memoryOrders.filter(
        (order) =>
          !order.archivedAt &&
          order.paymentStatus === "PAGO" &&
          !(order.status === "ENTREGUE" && order.kitchenClearedAt),
      ),
    );
  }

  const storeId = await getCurrentStoreId();

  if (!storeId) {
    return [];
  }

  const orders = (await prisma.order.findMany({
    where: {
      storeId,
      archivedAt: null,
      paymentStatus: "PAGO",
      OR: [
        { status: { not: "ENTREGUE" } },
        { kitchenClearedAt: null },
      ],
    },
    include: { items: true },
    orderBy: { orderNumber: "desc" },
  })) as PersistedOrder[];

  return orders.map(mapPersistedOrder);
}

export async function listPendingPaymentOrders() {
  if (!canUseDatabase()) {
    return sortOrders(
      memoryOrders.filter(
        (order) => !order.archivedAt && order.paymentStatus === "PENDENTE",
      ),
    );
  }

  const storeId = await getCurrentStoreId();

  if (!storeId) {
    return [];
  }

  const orders = (await prisma.order.findMany({
    where: {
      storeId,
      archivedAt: null,
      paymentStatus: "PENDENTE",
    },
    include: { items: true },
    orderBy: { orderNumber: "desc" },
  })) as PersistedOrder[];

  return orders.map(mapPersistedOrder);
}

export async function createOrder(params: {
  checkout: CheckoutInput;
  items: RequestedCartItem[];
}) {
  assertOrderStorageAvailable();

  const currentStoreConfig = await getResolvedStoreConfig();
  const resolvedItems = await resolveCartItems(params.items);
  const subtotal = resolvedItems.reduce((acc, item) => acc + item.subtotal, 0);
  const deliverySettings = resolveDeliverySettings(currentStoreConfig, params.checkout);
  const deliveryFee = deliverySettings.deliveryFee;
  const total = subtotal + deliveryFee;
  const orderTextBase = {
    items: resolvedItems,
    checkout: {
      ...params.checkout,
      deliveryArea: deliverySettings.deliveryArea,
    },
    subtotal,
    deliveryFee,
    estimatedDeliveryMin: deliverySettings.estimatedDeliveryMin,
    estimatedDeliveryMax: deliverySettings.estimatedDeliveryMax,
    total,
  };

  if (!canUseDatabase()) {
    const orderNumber = await getNextOrderNumber();
    const orderNumberFormatted = formatOrderNumber(orderNumber);
    const paymentCode = buildMockPaymentCode({
      orderNumberFormatted,
      total,
      paymentMethod: params.checkout.paymentMethod,
    });
    const orderText = buildOrderMessage({
      orderNumberFormatted,
      ...orderTextBase,
    });
    const order = toOrder({
      id: `order-${orderNumberFormatted}`,
      orderNumber,
      checkout: {
        ...params.checkout,
        deliveryArea: deliverySettings.deliveryArea,
      },
      items: resolvedItems,
      subtotal,
      deliveryFee,
      estimatedDeliveryMin: deliverySettings.estimatedDeliveryMin,
      estimatedDeliveryMax: deliverySettings.estimatedDeliveryMax,
      total,
      orderText,
      paymentProvider: undefined,
      paymentExternalId: undefined,
      paymentLink: undefined,
      paymentCode,
      kitchenClearedAt: undefined,
    });

    memoryOrders.unshift(order);

    return {
      order,
      whatsappUrl: buildWhatsAppUrl(orderText, currentStoreConfig.whatsappNumber),
    };
  }

  const persistedOrder = (await prisma.$transaction(async (tx) => {
    const store = await tx.store.findUnique({
      where: { slug: currentStoreConfig.slug },
      select: { id: true },
    });

    if (!store) {
      throw new OrderFlowError("Loja principal nao encontrada na base de dados.", 500);
    }

    const counter = await tx.orderCounter.upsert({
      where: { key: "orders" },
      update: {
        value: {
          increment: 1,
        },
      },
      create: {
        key: "orders",
        value: 1,
      },
      select: {
        value: true,
      },
    });

    const orderNumber = counter.value;
    const orderNumberFormatted = formatOrderNumber(orderNumber);
    const paymentCode = buildMockPaymentCode({
      orderNumberFormatted,
      total,
      paymentMethod: params.checkout.paymentMethod,
    });
    const orderText = buildOrderMessage({
      orderNumberFormatted,
      ...orderTextBase,
    });

    return tx.order.create({
      data: {
        orderNumber,
        orderNumberFormatted,
        storeId: store.id,
        customerName: params.checkout.customerName,
        phone: params.checkout.phone,
        address: params.checkout.address,
        houseNumber: params.checkout.houseNumber,
        deliveryArea: deliverySettings.deliveryArea,
        reference: params.checkout.reference,
        customerNote: params.checkout.customerNote,
        paymentMethod: params.checkout.paymentMethod,
        paymentStatus: "PENDENTE",
        paymentProvider: null,
        paymentExternalId: null,
        paymentLink: null,
        paymentCode,
        kitchenClearedAt: null,
        subtotal,
        deliveryFee,
        estimatedDeliveryMin: deliverySettings.estimatedDeliveryMin,
        estimatedDeliveryMax: deliverySettings.estimatedDeliveryMax,
        total,
        orderText,
        status: "NOVO",
        items: {
          create: resolvedItems.map((item) => ({
            productId: item.id,
            cartItemId: item.cartItemId,
            productName: item.name,
            category: item.category,
            unitPrice: item.price,
            quantity: item.quantity,
            customizationText: item.customizationText || null,
            subtotal: item.subtotal,
          })),
        },
      },
      include: { items: true },
    });
  })) as PersistedOrder;

  const whatsappUrl = buildWhatsAppUrl(
    persistedOrder.orderText,
    currentStoreConfig.whatsappNumber,
  );

  return {
    order: mapPersistedOrder(persistedOrder),
    whatsappUrl,
  };
}

export async function listAdminProducts() {
  const storeId = await getCurrentStoreId();

  if (!storeId) {
    return [];
  }

  const [items, categories] = await Promise.all([
    prisma.product.findMany({
      where: { storeId },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    listStoreCategories(),
  ]);

  return sortProductsByCategories(items, categories).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    imageUrl: item.imageUrl,
    category: item.category,
    compositionText: item.compositionText ?? "",
    sizeOptionsText: stringifySizeOptions(parseSizeOptionsJson(item.sizeOptionsJson)),
    optionalItemsText: stringifyOptionalItems(parseOptionalItemsJson(item.optionalItemsJson)),
    allowCustomerNote: item.allowCustomerNote,
    featured: item.featured,
    active: item.active,
    displayOrder: item.displayOrder,
  }));
}

export async function upsertAdminProduct(input: {
  id?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  compositionText?: string;
  sizeOptionsText?: string;
  optionalItemsText?: string;
  allowCustomerNote: boolean;
  featured: boolean;
  active: boolean;
}) {
  const storeId = await getCurrentStoreId();

  if (!storeId) {
    throw new OrderFlowError("Loja principal nao encontrada para editar produtos.", 500);
  }

  const currentMaxOrder = await prisma.product.aggregate({
    where: { storeId },
    _max: { displayOrder: true },
  });

  const displayOrder = currentMaxOrder._max.displayOrder ?? 0;

  const product = input.id
    ? await prisma.product.update({
        where: { id: input.id },
          data: {
            name: input.name,
            description: input.description,
            price: input.price,
            imageUrl: input.imageUrl,
            category: normalizeCategoryName(input.category),
            compositionText: input.compositionText?.trim() || null,
            sizeOptionsJson: JSON.stringify(parseSizeOptionsText(input.sizeOptionsText ?? "")),
            optionalItemsJson: JSON.stringify(parseOptionalItemsText(input.optionalItemsText ?? "")),
            allowCustomerNote: input.allowCustomerNote,
            featured: input.featured,
            active: input.active,
          },
        })
    : await prisma.product.create({
        data: {
          storeId,
          name: input.name,
          description: input.description,
          price: input.price,
          imageUrl: input.imageUrl,
          category: normalizeCategoryName(input.category),
          compositionText: input.compositionText?.trim() || null,
          sizeOptionsJson: JSON.stringify(parseSizeOptionsText(input.sizeOptionsText ?? "")),
          optionalItemsJson: JSON.stringify(parseOptionalItemsText(input.optionalItemsText ?? "")),
          allowCustomerNote: input.allowCustomerNote,
          featured: input.featured,
          active: input.active,
          displayOrder: displayOrder + 1,
        },
      });

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    imageUrl: product.imageUrl,
    category: product.category,
    compositionText: product.compositionText ?? "",
    sizeOptionsText: stringifySizeOptions(parseSizeOptionsJson(product.sizeOptionsJson)),
    optionalItemsText: stringifyOptionalItems(parseOptionalItemsJson(product.optionalItemsJson)),
    allowCustomerNote: product.allowCustomerNote,
    featured: product.featured,
    active: product.active,
    displayOrder: product.displayOrder,
  };
}

export async function getAdminStoreConfiguration() {
  const storeId = await getCurrentStoreId();
  const currentStoreConfig = await getResolvedStoreConfig();

  if (!storeId) {
    throw new OrderFlowError("Loja principal nao encontrada.", 500);
  }

  const [store, settings, banners, categories] = await Promise.all([
    prisma.store.findUnique({ where: { id: storeId } }),
    prisma.storeSettings.findUnique({ where: { storeId } }),
    prisma.storeBanner.findMany({
      where: { storeId },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.storeCategory.findMany({
      where: { storeId },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!store || !settings) {
    throw new OrderFlowError("Configuracoes da loja nao encontradas.", 500);
  }

  return {
    store: {
      name: store.name,
      shortName: settings.shortName,
      logoText: settings.logoText,
      logoPath: settings.logoPath ?? "",
      phoneDisplay: settings.phoneDisplay,
      whatsappNumber: settings.whatsappNumber,
      address: settings.address,
      openingHours: settings.openingHours,
      deliveryFee: Number(settings.defaultDeliveryFee ?? currentStoreConfig.deliveryFee),
      estimatedDeliveryMin:
        settings.estimatedDeliveryMin ?? currentStoreConfig.estimatedDeliveryMin,
      estimatedDeliveryMax:
        settings.estimatedDeliveryMax ?? currentStoreConfig.estimatedDeliveryMax,
      deliveryAreasText: formatDeliveryAreasText(
        parseDeliveryAreasJson(settings.deliveryAreasJson).length > 0
          ? parseDeliveryAreasJson(settings.deliveryAreasJson)
          : currentStoreConfig.deliveryAreas,
      ),
      heroTitle: settings.heroTitle,
      heroDescription: settings.heroDescription,
      eyebrow: settings.eyebrow,
      tagline: settings.tagline,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      surfaceColor: settings.surfaceColor,
    },
    banners: banners.map((banner) => ({
      id: banner.id,
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      ctaLabel: banner.ctaLabel,
      ctaHref: banner.ctaHref ?? "#cardapio",
      ctaMode: (banner.ctaMode as "LINK" | "ADD_TO_CART" | undefined) ?? "LINK",
      ctaProductId: banner.ctaProductId ?? "",
      campaignBadge: banner.campaignBadge ?? "",
      highlighted: banner.highlighted,
      startsAt: banner.startsAt?.toISOString() ?? "",
      endsAt: banner.endsAt?.toISOString() ?? "",
      active: banner.active,
      displayOrder: banner.displayOrder,
    })),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      active: category.active,
      displayOrder: category.displayOrder,
    })),
  };
}

export async function updateAdminStoreConfiguration(input: {
  name: string;
  shortName: string;
  logoText: string;
  logoPath?: string;
  phoneDisplay: string;
  whatsappNumber: string;
  address: string;
  openingHours: string;
  deliveryFee: number;
  estimatedDeliveryMin: number;
  estimatedDeliveryMax: number;
  deliveryAreasText: string;
  heroTitle: string;
  heroDescription: string;
  eyebrow: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceColor: string;
}) {
  const storeId = await getCurrentStoreId();

  if (!storeId) {
    throw new OrderFlowError("Loja principal nao encontrada.", 500);
  }

  await prisma.store.update({
    where: { id: storeId },
    data: {
      name: input.name,
    },
  });

  await prisma.storeSettings.update({
    where: { storeId },
    data: {
      whatsappNumber: input.whatsappNumber,
      shortName: input.shortName,
      logoText: input.logoText,
      logoPath: input.logoPath || null,
      phoneDisplay: input.phoneDisplay,
      address: input.address,
      openingHours: input.openingHours,
      defaultDeliveryFee: input.deliveryFee,
      estimatedDeliveryMin: input.estimatedDeliveryMin,
      estimatedDeliveryMax: input.estimatedDeliveryMax,
      deliveryAreasJson: JSON.stringify(parseDeliveryAreasText(input.deliveryAreasText)),
      heroTitle: input.heroTitle,
      heroDescription: input.heroDescription,
      eyebrow: input.eyebrow,
      tagline: input.tagline,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      accentColor: input.accentColor,
      surfaceColor: input.surfaceColor,
    },
  });

  return true;
}

export async function upsertAdminBanner(input: {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaLabel: string;
  ctaMode?: "LINK" | "ADD_TO_CART";
  ctaHref?: string;
  ctaProductId?: string;
  campaignBadge?: string;
  highlighted?: boolean;
  startsAt?: string;
  endsAt?: string;
  displayOrder?: number;
  active: boolean;
}) {
  const storeId = await getCurrentStoreId();

  if (!storeId) {
    throw new OrderFlowError("Loja principal nao encontrada.", 500);
  }

  const currentMaxOrder = await prisma.storeBanner.aggregate({
    where: { storeId },
    _max: { displayOrder: true },
  });

  const displayOrder = currentMaxOrder._max.displayOrder ?? 0;

  const banner = input.id
    ? await prisma.storeBanner.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          imageUrl: input.imageUrl,
          ctaLabel: input.ctaLabel,
          ctaMode: input.ctaMode ?? "LINK",
          ctaHref: input.ctaHref || "#cardapio",
          ctaProductId: input.ctaMode === "ADD_TO_CART" ? input.ctaProductId || null : null,
          campaignBadge: input.campaignBadge?.trim() || null,
          highlighted: input.highlighted ?? false,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          displayOrder: input.displayOrder ?? 0,
          active: input.active,
        },
      })
    : await prisma.storeBanner.create({
        data: {
          storeId,
          title: input.title,
          description: input.description,
          imageUrl: input.imageUrl,
          ctaLabel: input.ctaLabel,
          ctaMode: input.ctaMode ?? "LINK",
          ctaHref: input.ctaHref || "#cardapio",
          ctaProductId: input.ctaMode === "ADD_TO_CART" ? input.ctaProductId || null : null,
          campaignBadge: input.campaignBadge?.trim() || null,
          highlighted: input.highlighted ?? false,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          active: input.active,
          displayOrder: input.displayOrder ?? displayOrder + 1,
        },
      });

  return {
    id: banner.id,
    title: banner.title,
    description: banner.description,
    imageUrl: banner.imageUrl,
    ctaLabel: banner.ctaLabel,
    ctaHref: banner.ctaHref ?? "#cardapio",
    ctaMode: (banner.ctaMode as "LINK" | "ADD_TO_CART" | undefined) ?? "LINK",
    ctaProductId: banner.ctaProductId ?? "",
    campaignBadge: banner.campaignBadge ?? "",
    highlighted: banner.highlighted,
    startsAt: banner.startsAt?.toISOString() ?? "",
    endsAt: banner.endsAt?.toISOString() ?? "",
    active: banner.active,
    displayOrder: banner.displayOrder,
  };
}

export async function upsertAdminCategory(input: {
  id?: string;
  name: string;
  displayOrder: number;
  active: boolean;
}) {
  const storeId = await getCurrentStoreId();

  if (!storeId) {
    throw new OrderFlowError("Loja principal nao encontrada para editar categorias.", 500);
  }

  const name = normalizeCategoryName(input.name);

  const existingCategory = await prisma.storeCategory.findFirst({
    where: {
      storeId,
      name,
      ...(input.id ? { NOT: { id: input.id } } : {}),
    },
  });

  if (existingCategory) {
    throw new OrderFlowError("Ja existe uma categoria com esse nome.", 400);
  }

  const category = input.id
    ? await prisma.$transaction(async (tx) => {
        const currentCategory = await tx.storeCategory.findUnique({
          where: { id: input.id },
        });

        if (!currentCategory) {
          throw new OrderFlowError("Categoria nao encontrada.", 404);
        }

        const updatedCategory = await tx.storeCategory.update({
          where: { id: input.id },
          data: {
            name,
            displayOrder: input.displayOrder,
            active: input.active,
          },
        });

        if (currentCategory.name !== name) {
          await tx.product.updateMany({
            where: {
              storeId,
              category: currentCategory.name,
            },
            data: {
              category: name,
            },
          });
        }

        return updatedCategory;
      })
    : await prisma.storeCategory.create({
        data: {
          storeId,
          name,
          displayOrder: input.displayOrder,
          active: input.active,
        },
      });

  return {
    id: category.id,
    name: category.name,
    active: category.active,
    displayOrder: category.displayOrder,
  };
}

export async function listStoreCategories() {
  const storeId = await getCurrentStoreId();

  if (!process.env.DATABASE_URL || !storeId) {
    const fallbackNames = Array.from(
      new Set(products.map((product) => normalizeCategoryName(product.category)).filter(Boolean)),
    );

    return fallbackNames.map((name, index) => ({
      id: `fallback-category-${index + 1}`,
      name,
      active: true,
      displayOrder: index + 1,
    }));
  }

  const categories = await prisma.storeCategory.findMany({
    where: { storeId },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    active: category.active,
    displayOrder: category.displayOrder,
  }));
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  if (!canUseDatabase()) {
    const order = memoryOrders.find((entry) => entry.id === id);

    if (!order) {
      return null;
    }

    order.status = status;
    if (status !== "ENTREGUE") {
      order.kitchenClearedAt = undefined;
    }
    order.updatedAt = new Date().toISOString();
    return order;
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(status !== "ENTREGUE" ? { kitchenClearedAt: null } : {}),
    },
    include: { items: true },
  });

  return mapPersistedOrder(updatedOrder as PersistedOrder);
}

export async function confirmOrderPayment(id: string, paymentCode: string) {
  if (!canUseDatabase()) {
    const order = memoryOrders.find((entry) => entry.id === id);

    if (!order) {
      throw new OrderFlowError("Pedido nao encontrado.", 404);
    }

    if (order.paymentCode !== paymentCode) {
      throw new OrderFlowError("Codigo de pagamento invalido.", 400);
    }

    order.paymentStatus = "PAGO";
    order.paymentConfirmedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    return order;
  }

  const currentOrder = await prisma.order.findUnique({
    where: { id },
    select: { id: true, paymentCode: true },
  });

  if (!currentOrder) {
    throw new OrderFlowError("Pedido nao encontrado.", 404);
  }

  if (currentOrder.paymentCode !== paymentCode) {
    throw new OrderFlowError("Codigo de pagamento invalido.", 400);
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      paymentStatus: "PAGO",
      paymentConfirmedAt: new Date(),
    },
    include: { items: true },
  });

  return mapPersistedOrder(updatedOrder as PersistedOrder);
}

export async function markOrderAsPaid(id: string) {
  if (!canUseDatabase()) {
    const order = memoryOrders.find((entry) => entry.id === id);

    if (!order) {
      throw new OrderFlowError("Pedido nao encontrado.", 404);
    }

    order.paymentStatus = "PAGO";
    order.paymentConfirmedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    return order;
  }

  const currentOrder = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!currentOrder) {
    throw new OrderFlowError("Pedido nao encontrado.", 404);
  }

  if (currentOrder.paymentStatus === "PAGO") {
    return mapPersistedOrder(currentOrder as PersistedOrder);
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: {
      paymentStatus: "PAGO",
      paymentConfirmedAt: new Date(),
    },
    include: { items: true },
  });

  return mapPersistedOrder(updatedOrder as PersistedOrder);
}

export async function clearKitchenDeliveredOrders() {
  if (!canUseDatabase()) {
    let cleared = 0;

    for (const order of memoryOrders) {
      if (order.status === "ENTREGUE" && !order.kitchenClearedAt) {
        order.kitchenClearedAt = new Date().toISOString();
        order.updatedAt = new Date().toISOString();
        cleared += 1;
      }
    }

    return { cleared };
  }

  const storeId = await getCurrentStoreId();

  if (!storeId) {
    throw new OrderFlowError("Loja principal nao encontrada.", 500);
  }

  const result = await prisma.order.updateMany({
    where: {
      storeId,
      status: "ENTREGUE",
      kitchenClearedAt: null,
    },
    data: {
      kitchenClearedAt: new Date(),
    },
  });

  return { cleared: result.count };
}

export async function clearAllOrdersHistory() {
  if (!canUseDatabase()) {
    const archivedAt = new Date().toISOString();
    let cleared = 0;

    memoryOrders.forEach((order) => {
      if (!order.archivedAt) {
        order.archivedAt = archivedAt;
        cleared += 1;
      }
    });

    return { cleared };
  }

  const storeId = await getCurrentStoreId();

  if (!storeId) {
    throw new OrderFlowError("Loja principal nao encontrada.", 500);
  }

  const archivedAt = new Date();
  const result = await prisma.order.updateMany({
    where: {
      storeId,
      archivedAt: null,
    },
    data: {
      archivedAt,
    },
  });

  return { cleared: result.count };
}

export async function confirmOrderPaymentByExternalId(externalId: string) {
  if (!canUseDatabase()) {
    return null;
  }

  const currentOrder = await prisma.order.findFirst({
    where: { paymentExternalId: externalId },
    include: { items: true },
  });

  if (!currentOrder) {
    return null;
  }

  if (currentOrder.paymentStatus === "PAGO") {
    return mapPersistedOrder(currentOrder as PersistedOrder);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: currentOrder.id },
    data: {
      paymentStatus: "PAGO",
      paymentConfirmedAt: new Date(),
    },
    include: { items: true },
  });

  return mapPersistedOrder(updatedOrder as PersistedOrder);
}

export async function getPublicOrderPaymentStatus(id: string) {
  if (!canUseDatabase()) {
    const order = memoryOrders.find((entry) => entry.id === id);

    if (!order) {
      throw new OrderFlowError("Pedido nao encontrado.", 404);
    }

    return {
      id: order.id,
      orderNumberFormatted: order.orderNumberFormatted,
      paymentStatus: order.paymentStatus,
      paymentProvider: order.paymentProvider,
      paymentLink: order.paymentLink,
    };
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNumberFormatted: true,
      paymentStatus: true,
      paymentProvider: true,
      paymentLink: true,
    },
  });

  if (!order) {
    throw new OrderFlowError("Pedido nao encontrado.", 404);
  }

  return order;
}

export async function getPublicOrderPaymentContextByNumber(orderNumberFormatted: string) {
  if (!canUseDatabase()) {
    const order = memoryOrders.find(
      (entry) => entry.orderNumberFormatted === orderNumberFormatted,
    );

    if (!order) {
      throw new OrderFlowError("Pedido nao encontrado.", 404);
    }

    const currentStoreConfig = await getResolvedStoreConfig();

    return {
      id: order.id,
      orderNumberFormatted: order.orderNumberFormatted,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paymentProvider: order.paymentProvider,
      paymentLink: order.paymentLink,
      whatsappUrl: buildWhatsAppUrl(order.orderText, currentStoreConfig.whatsappNumber),
    };
  }

  const order = await prisma.order.findUnique({
    where: { orderNumberFormatted },
    select: {
      id: true,
      orderNumberFormatted: true,
      paymentMethod: true,
      paymentStatus: true,
      paymentProvider: true,
      paymentLink: true,
      orderText: true,
    },
  });

  if (!order) {
    throw new OrderFlowError("Pedido nao encontrado.", 404);
  }

  const currentStoreConfig = await getResolvedStoreConfig();

  return {
    id: order.id,
    orderNumberFormatted: order.orderNumberFormatted,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentProvider: order.paymentProvider,
    paymentLink: order.paymentLink,
    whatsappUrl: buildWhatsAppUrl(order.orderText, currentStoreConfig.whatsappNumber),
  };
}
