import { paymentLabels } from "./constants";
import { formatDeliveryEstimate } from "./delivery";
import { formatCurrency, formatPhone, formatTimeLabel } from "./format";
import type { CartItem, CheckoutInput } from "./types";

export function buildOrderMessage(params: {
  orderNumberFormatted: string;
  items: CartItem[];
  checkout: CheckoutInput;
  subtotal: number;
  deliveryFee: number;
  estimatedDeliveryMin: number;
  estimatedDeliveryMax: number;
  total: number;
  createdAt?: Date;
}) {
  const createdAt = params.createdAt ?? new Date();
  const itemLines = params.items
    .map(
      (item) =>
        `- ${item.name}\n  ${item.quantity}x ${formatCurrency(item.price)} = ${formatCurrency(item.subtotal)}`,
    )
    .join("\n\n");

  return [
    `NOVO PEDIDO ( Pedido ndeg ${params.orderNumberFormatted} )`,
    "",
    `Horario: ${formatTimeLabel(createdAt)}`,
    "",
    "Itens:",
    itemLines,
    "",
    `Subtotal: ${formatCurrency(params.subtotal)}`,
    `Entrega: ${formatCurrency(params.deliveryFee)}`,
    `Previsao: ${formatDeliveryEstimate(params.estimatedDeliveryMin, params.estimatedDeliveryMax)}`,
    `Total: ${formatCurrency(params.total)}`,
    "",
    `Cliente: ${params.checkout.customerName}`,
    `Telefone: ${formatPhone(params.checkout.phone)}`,
    "",
    "Endereco:",
    `${params.checkout.address}, N ${params.checkout.houseNumber}`,
    params.checkout.deliveryArea
      ? `Bairro/Regiao: ${params.checkout.deliveryArea}`
      : null,
    "",
    `Referencia: ${params.checkout.reference || "Nao informada"}`,
    "",
    `Pagamento: ${paymentLabels[params.checkout.paymentMethod]}`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

export function buildWhatsAppUrl(message: string, whatsappNumber: string) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
