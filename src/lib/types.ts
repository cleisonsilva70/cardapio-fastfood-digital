export type ProductCategory = "BURGERS" | "COMBOS" | "BEBIDAS" | "ADICIONAIS";

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

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: ProductCategory;
  featured?: boolean;
};

export type CartItem = Product & {
  quantity: number;
  subtotal: number;
};

export type CheckoutInput = {
  customerName: string;
  phone: string;
  address: string;
  houseNumber: string;
  deliveryArea?: string;
  reference?: string;
  paymentMethod: PaymentMethod;
};

export type OrderItem = {
  id: string;
  productId?: string;
  productName: string;
  category: ProductCategory;
  unitPrice: number;
  quantity: number;
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
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProvider?: string;
  paymentExternalId?: string;
  paymentLink?: string;
  paymentCode?: string;
  paymentConfirmedAt?: string;
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
