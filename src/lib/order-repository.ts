import { createHostedPaymentSession } from "./asaas";
import { prisma } from "./prisma";
import { buildMockPaymentCode } from "./payment";
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
  productName: string;
  category: string;
  unitPrice: { toString(): string } | number;
  quantity: number;
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
  paymentMethod: Order["paymentMethod"];
  paymentStatus: PaymentStatus;
  paymentProvider: string | null;
  paymentExternalId: string | null;
  paymentLink: string | null;
  paymentCode: string | null;
  paymentConfirmedAt: Date | null;
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

type RequestedCartItem = Pick<CartItem, "id" | "quantity">;

type ResolvedCartItem = CartItem;

function mapItems(items: CartItem[]): OrderItem[] {
  return items.map((item) => ({
    id: `${item.id}-${Math.random().toString(16).slice(2, 8)}`,
    productId: item.id,
    productName: item.name,
    category: item.category,
    unitPrice: item.price,
    quantity: item.quantity,
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
    paymentMethod: params.checkout.paymentMethod,
    paymentStatus: params.paymentStatus ?? "PENDENTE",
    paymentProvider: params.paymentProvider,
    paymentExternalId: params.paymentExternalId,
    paymentLink: params.paymentLink,
    paymentCode: params.paymentCode,
    paymentConfirmedAt: params.paymentConfirmedAt?.toISOString(),
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

    return {
      ...product,
      quantity: item.quantity,
      subtotal: product.price * item.quantity,
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
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentProvider: order.paymentProvider ?? undefined,
    paymentExternalId: order.paymentExternalId ?? undefined,
    paymentLink: order.paymentLink ?? undefined,
    paymentCode: order.paymentCode ?? undefined,
    paymentConfirmedAt: order.paymentConfirmedAt?.toISOString(),
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
      productName: item.productName,
      category: item.category as OrderItem["category"],
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
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

  const persistedProducts = await prisma.product.findMany({
    where: {
      storeId,
      active: true,
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  if (persistedProducts.length === 0) {
    return products;
  }

  return persistedProducts.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    imageUrl: product.imageUrl,
    category: product.category,
    featured: product.featured,
  }));
}

export async function listOrders() {
  if (!canUseDatabase()) {
    return sortOrders(memoryOrders);
  }

  const storeId = await getCurrentStoreId();

  if (!storeId) {
    return [];
  }

  const orders = (await prisma.order.findMany({
    where: {
      storeId,
    },
    include: { items: true },
    orderBy: { orderNumber: "desc" },
  })) as PersistedOrder[];

  return orders.map(mapPersistedOrder);
}

export async function listKitchenOrders() {
  if (!canUseDatabase()) {
    return sortOrders(memoryOrders.filter((order) => order.paymentStatus === "PAGO"));
  }

  const storeId = await getCurrentStoreId();

  if (!storeId) {
    return [];
  }

  const orders = (await prisma.order.findMany({
    where: {
      storeId,
      paymentStatus: "PAGO",
    },
    include: { items: true },
    orderBy: { orderNumber: "desc" },
  })) as PersistedOrder[];

  return orders.map(mapPersistedOrder);
}

async function attachHostedPaymentIfAvailable(params: {
  order: PersistedOrder;
  checkout: CheckoutInput;
  items: CartItem[];
  deliveryFee: number;
  storeName: string;
  whatsappUrl: string;
}) {
  const hostedPayment = await createHostedPaymentSession({
    orderId: params.order.id,
    orderNumberFormatted: params.order.orderNumberFormatted,
    storeName: params.storeName,
    checkout: params.checkout,
    items: params.items,
    deliveryFee: params.deliveryFee,
    total: Number(params.order.total),
    whatsappUrl: params.whatsappUrl,
  });

  if (!hostedPayment) {
    return {
      order: mapPersistedOrder(params.order),
      paymentUrl: undefined,
    };
  }

  const updatedOrder = await prisma.order.update({
    where: { id: params.order.id },
    data: {
      paymentProvider: hostedPayment.provider,
      paymentExternalId: hostedPayment.externalId,
      paymentLink: hostedPayment.paymentUrl,
    },
    include: { items: true },
  });

  return {
    order: mapPersistedOrder(updatedOrder as PersistedOrder),
    paymentUrl: hostedPayment.paymentUrl,
  };
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
        paymentMethod: params.checkout.paymentMethod,
        paymentStatus: "PENDENTE",
        paymentProvider: null,
        paymentExternalId: null,
        paymentLink: null,
        paymentCode,
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
            productName: item.name,
            category: item.category,
            unitPrice: item.price,
            quantity: item.quantity,
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

  const paymentResult = await attachHostedPaymentIfAvailable({
    order: persistedOrder,
    checkout: {
      ...params.checkout,
      deliveryArea: deliverySettings.deliveryArea,
    },
    items: resolvedItems,
    deliveryFee,
    storeName: currentStoreConfig.name,
    whatsappUrl,
  });

  return {
    order: paymentResult.order,
    whatsappUrl,
    paymentUrl: paymentResult.paymentUrl,
  };
}

export async function listAdminProducts() {
  const storeId = await getCurrentStoreId();

  if (!storeId) {
    return [];
  }

  const items = await prisma.product.findMany({
    where: { storeId },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    imageUrl: item.imageUrl,
    category: item.category,
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
  category: "BURGERS" | "COMBOS" | "BEBIDAS" | "ADICIONAIS";
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
          category: input.category,
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
          category: input.category,
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

  const [store, settings, banners] = await Promise.all([
    prisma.store.findUnique({ where: { id: storeId } }),
    prisma.storeSettings.findUnique({ where: { storeId } }),
    prisma.storeBanner.findMany({
      where: { storeId },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
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
      active: banner.active,
      displayOrder: banner.displayOrder,
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
          active: input.active,
          displayOrder: displayOrder + 1,
        },
      });

  return {
    id: banner.id,
    title: banner.title,
    description: banner.description,
    imageUrl: banner.imageUrl,
    ctaLabel: banner.ctaLabel,
    active: banner.active,
    displayOrder: banner.displayOrder,
  };
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  if (!canUseDatabase()) {
    const order = memoryOrders.find((entry) => entry.id === id);

    if (!order) {
      return null;
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    return order;
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { status },
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
