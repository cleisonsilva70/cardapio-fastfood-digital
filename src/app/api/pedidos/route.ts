import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import {
  createOrder,
  listPendingPaymentOrders,
  listKitchenOrders,
  listOrders,
  OrderFlowError,
} from "@/lib/order-repository";
import { createOrderSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const isAuthenticated = await isOwnerAuthenticated();

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");
  const orders =
    scope === "kitchen"
      ? await listKitchenOrders()
      : scope === "atendimento"
        ? await listPendingPaymentOrders()
        : await listOrders();

  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Dados invalidos.",
        },
        { status: 400 },
      );
    }

    const result = await createOrder(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/pedidos failed", error);

    if (error instanceof OrderFlowError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel registrar o pedido agora.",
      },
      { status: 500 },
    );
  }
}
