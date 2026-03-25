export type ProductCategory = string;

export type OrderStatus = "NOVO" | "EM_PREPARO" | "PRONTO" | "ENTREGUE";

export type PaymentMethod =
  | "PIX"
  | "DINHEIRO"
  | "CARTAO_CREDITO"
  | "CARTAO_DEBITO";

export type PaymentStatus = "PENDENTE" | "PAGO" | "FALHOU" | "CANCELADO";

export type DeliveryAreaRule = {
  id: string;
  name: string;
  fee: number;
  estimatedDeliveryMin: number;
  estimatedDeliveryMax: number;
  active?: boolean;
};

export type StoreCategory = {
  id: string;
  name: string;
  active: boolean;
  displayOrder: number;
};

export type ProductSizeOption = {
  id: string;
  label: string;
  priceDelta: number;
};

export type ProductOptionalItem = {
  id: string;
  label: string;
  price: number;
};

export type PromoBanner = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref?: string;
  ctaMode?: "LINK" | "ADD_TO_CART";
  ctaProductId?: string;
  campaignBadge?: string;
  highlighted?: boolean;
  startsAt?: string;
  endsAt?: string;
  displayOrder?: number;
  active?: boolean;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: ProductCategory;
  featured?: boolean;
  compositionText?: string;
  sizeOptions?: ProductSizeOption[];
  optionalItems?: ProductOptionalItem[];
  allowCustomerNote?: boolean;
};

export type CartItem = Product & {
  cartItemId: string;
  quantity: number;
  selectedSizeId?: string;
  selectedSizeLabel?: string;
  selectedSizePriceDelta?: number;
  selectedOptionalItemIds?: string[];
  selectedOptionalItemLabels?: string[];
  selectedOptionalItemTotal?: number;
  customerNote?: string;
  customizationText?: string;
  subtotal: number;
};

export type CheckoutInput = {
  customerName: string;
  phone: string;
  address: string;
  houseNumber: string;
  deliveryArea?: string;
  reference?: string;
  customerNote?: string;
  cashChangeFor?: string;
  paymentMethod: PaymentMethod;
};

export type OrderItem = {
  id: string;
  productId?: string;
  cartItemId?: string;
  productName: string;
  category: string;
  unitPrice: number;
  quantity: number;
  customizationText?: string;
  subtotal: number;
};

export type Order = {
  id: string;
  orderNumber: number;
  orderNumberFormatted: string;
  customerName: string;
  phone: string;
  address: string;
  houseNumber: string;
  deliveryArea?: string;
  reference?: string;
  customerNote?: string;
  cashChangeFor?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProvider?: string;
  paymentExternalId?: string;
  paymentLink?: string;
  paymentCode?: string;
  paymentConfirmedAt?: string;
  kitchenClearedAt?: string;
  archivedAt?: string;
  subtotal: number;
  deliveryFee: number;
  estimatedDeliveryMin?: number;
  estimatedDeliveryMax?: number;
  total: number;
  orderText: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  displayTime: string;
  items: OrderItem[];
};
