import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductCategory,
} from "./types";
import { getStoreConfig, getBrandingConfig } from "./white-label";

export const categoryLabels: Record<ProductCategory, string> = {
  BURGERS: "Burgers",
  COMBOS: "Combos",
  BEBIDAS: "Bebidas",
  ADICIONAIS: "Adicionais",
};

export const paymentLabels: Record<PaymentMethod, string> = {
  PIX: "Pix",
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Cartao de credito",
  CARTAO_DEBITO: "Cartao de debito",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDENTE: "Pagamento pendente",
  PAGO: "Pago",
  FALHOU: "Falhou",
  CANCELADO: "Cancelado",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  NOVO: "Novo",
  EM_PREPARO: "Em preparo",
  PRONTO: "Pronto",
  ENTREGUE: "Entregue",
};

export const orderStatusSequence: OrderStatus[] = [
  "NOVO",
  "EM_PREPARO",
  "PRONTO",
  "ENTREGUE",
];

export const kitchenStatusActions: Record<
  OrderStatus,
  { label: string; nextStatus?: OrderStatus }
> = {
  NOVO: { label: "Enviar para preparo", nextStatus: "EM_PREPARO" },
  EM_PREPARO: { label: "Marcar pronto", nextStatus: "PRONTO" },
  PRONTO: { label: "Marcar entregue", nextStatus: "ENTREGUE" },
  ENTREGUE: { label: "Pedido concluido" },
};

const storeConfig = getStoreConfig();
const brandingConfig = getBrandingConfig();

export const restaurantConfig = {
  name: storeConfig.name,
  slug: storeConfig.slug,
  whatsappNumber: storeConfig.whatsappNumber,
  heroDescription: brandingConfig.heroDescription,
};
