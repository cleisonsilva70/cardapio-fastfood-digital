import { paymentLabels } from "./constants";
import { formatDeliveryEstimate } from "./delivery";
import {
  formatCashChangeFor,
  formatCurrency,
  formatPhone,
  formatTimeLabel,
} from "./format";
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
        `- ${item.name}${
          item.customizationText ? `\n  ${item.customizationText}` : ""
        }\n  ${item.quantity}x ${formatCurrency(item.price)} = ${formatCurrency(item.subtotal)}`,
    )
    .join("\n\n");

  const summaryLines = [
    `Subtotal: ${formatCurrency(params.subtotal)}`,
    params.deliveryFee > 0 ? `Entrega: ${formatCurrency(params.deliveryFee)}` : "Entrega: sem taxa",
    `Previsao: ${formatDeliveryEstimate(params.estimatedDeliveryMin, params.estimatedDeliveryMax)}`,
    `Total: ${formatCurrency(params.total)}`,
  ];

  const addressLines = [
    `${params.checkout.address}, numero ${params.checkout.houseNumber}`,
    params.checkout.deliveryArea ? `Bairro: ${params.checkout.deliveryArea}` : null,
    params.checkout.reference ? `Referencia: ${params.checkout.reference}` : null,
  ].filter((line): line is string => Boolean(line));

  const cashChangeLabel =
    params.checkout.paymentMethod === "DINHEIRO"
      ? formatCashChangeFor(params.checkout.cashChangeFor)
      : undefined;

  return [
    `🍔 *NOVO PEDIDO*`,
    "",
    `🧾 Pedido #${params.orderNumberFormatted}`,
    `🕒 Horario: ${formatTimeLabel(createdAt)}`,
    "",
    `📦 *ITENS*`,
    "",
    itemLines,
    "",
    `💰 *RESUMO*`,
    "",
    ...summaryLines,
    "",
    `👤 *CLIENTE*`,
    "",
    `Nome: ${params.checkout.customerName}`,
    `Telefone: ${formatPhone(params.checkout.phone)}`,
    "",
    `📍 *ENTREGA*`,
    "",
    ...addressLines,
    "",
    params.checkout.customerNote ? `📝 *OBSERVACAO GERAL*\n${params.checkout.customerNote}\n` : null,
    params.checkout.customerNote ? "" : null,
    `💳 *PAGAMENTO*`,
    "",
    paymentLabels[params.checkout.paymentMethod],
    cashChangeLabel ? `Troco para: ${cashChangeLabel}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

export function buildWhatsAppUrl(message: string, whatsappNumber: string) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
