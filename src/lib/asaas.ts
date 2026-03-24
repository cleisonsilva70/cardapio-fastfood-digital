import type { CartItem, CheckoutInput, PaymentMethod } from "./types";

export type HostedPaymentSession = {
  provider: "ASAAS";
  externalId: string;
  paymentUrl: string;
};

type CreateHostedPaymentParams = {
  orderId: string;
  orderNumberFormatted: string;
  storeName: string;
  checkout: CheckoutInput;
  items: CartItem[];
  deliveryFee: number;
  total: number;
  whatsappUrl: string;
};

function getAsaasBaseUrl() {
  return process.env.ASAAS_ENVIRONMENT === "production"
    ? "https://api.asaas.com"
    : "https://api-sandbox.asaas.com";
}

function getAsaasBillingType(paymentMethod: PaymentMethod) {
  switch (paymentMethod) {
    case "PIX":
      return "PIX";
    case "CARTAO_CREDITO":
      return "CREDIT_CARD";
    default:
      return null;
  }
}

export function isHostedPaymentEnabled() {
  return Boolean(process.env.ASAAS_API_KEY && process.env.APP_BASE_URL);
}

export async function createHostedPaymentSession(
  params: CreateHostedPaymentParams,
): Promise<HostedPaymentSession | null> {
  if (!isHostedPaymentEnabled()) {
    return null;
  }

  const billingType = getAsaasBillingType(params.checkout.paymentMethod);

  if (!billingType) {
    return null;
  }

  const appBaseUrl = process.env.APP_BASE_URL;

  if (!appBaseUrl) {
    return null;
  }

  const callbackBase = `${appBaseUrl}/pedido/${encodeURIComponent(params.orderNumberFormatted)}?orderId=${encodeURIComponent(params.orderId)}&provider=ASAAS&paymentMethod=${encodeURIComponent(params.checkout.paymentMethod)}&whatsapp=${encodeURIComponent(params.whatsappUrl)}`;

  const response = await fetch(`${getAsaasBaseUrl()}/v3/checkouts`, {
    method: "POST",
    headers: {
      access_token: process.env.ASAAS_API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      billingTypes: [billingType],
      chargeTypes: ["DETACHED"],
      minutesToExpire: 60,
      callback: {
        successUrl: `${callbackBase}&status=success`,
        cancelUrl: `${callbackBase}&status=cancelled`,
        expiredUrl: `${callbackBase}&status=expired`,
      },
      items: [
        ...params.items.map((item) => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          value: Number(item.price.toFixed(2)),
        })),
        ...(params.deliveryFee > 0
          ? [
              {
                name: "Taxa de entrega",
                description: "Entrega da hamburgueria",
                quantity: 1,
                value: Number(params.deliveryFee.toFixed(2)),
              },
            ]
          : []),
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Asaas checkout error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { id?: string };

  if (!data.id) {
    throw new Error("Asaas checkout returned no id.");
  }

  return {
    provider: "ASAAS",
    externalId: data.id,
    paymentUrl: `https://asaas.com/checkoutSession/show?id=${data.id}`,
  };
}
