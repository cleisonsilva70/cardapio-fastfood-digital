import type { PaymentMethod } from "./types";

export function buildMockPaymentCode(params: {
  orderNumberFormatted: string;
  total: number;
  paymentMethod: PaymentMethod;
}) {
  const amount = params.total.toFixed(2).replace(".", "");
  return `${params.paymentMethod}-${params.orderNumberFormatted}-${amount}`;
}

export function getPaymentInstructions(paymentMethod: PaymentMethod) {
  switch (paymentMethod) {
    case "PIX":
      return {
        title: "Pague com Pix",
        description:
          "Copie o codigo abaixo ou use o QR/Pix do gateway quando integrarmos o provedor real.",
        cta: "Simular pagamento Pix confirmado",
      };
    case "CARTAO_CREDITO":
      return {
        title: "Pague com cartao de credito",
        description:
          "Fluxo preparado para gateway online. Nesta etapa estamos usando confirmacao simulada.",
        cta: "Simular pagamento no credito",
      };
    case "CARTAO_DEBITO":
      return {
        title: "Pague com cartao de debito",
        description:
          "Fluxo preparado para gateway online. Nesta etapa estamos usando confirmacao simulada.",
        cta: "Simular pagamento no debito",
      };
    default:
      return {
        title: "Pagamento antecipado necessario",
        description:
          "Para liberar a cozinha automaticamente, use Pix ou cartao online.",
        cta: "Marcar pagamento confirmado",
      };
  }
}
