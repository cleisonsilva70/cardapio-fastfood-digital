import { NextResponse } from "next/server";
import { confirmOrderPaymentByExternalId } from "@/lib/order-repository";

function isWebhookAuthorized(request: Request) {
  const configuredToken = process.env.ASAAS_WEBHOOK_TOKEN;

  if (!configuredToken) {
    return true;
  }

  const { searchParams } = new URL(request.url);
  return searchParams.get("token") === configuredToken;
}

function extractExternalId(payload: Record<string, unknown>) {
  const event = typeof payload.event === "string" ? payload.event : "";
  const checkout = payload.checkout as { id?: string } | undefined;
  const payment = payload.payment as { id?: string } | undefined;

  if (event === "CHECKOUT_PAID") {
    return checkout?.id ?? null;
  }

  if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
    return payment?.id ?? null;
  }

  return null;
}

export async function POST(request: Request) {
  if (!isWebhookAuthorized(request)) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const externalId = extractExternalId(payload);

    if (externalId) {
      await confirmOrderPaymentByExternalId(externalId);
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Nao foi possivel processar o webhook." },
      { status: 500 },
    );
  }
}
