import { NextResponse } from "next/server";
import {
  confirmOrderPayment,
  getPublicOrderPaymentStatus,
  OrderFlowError,
} from "@/lib/order-repository";
import { confirmPaymentSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payment = await getPublicOrderPaymentStatus(id);
    return NextResponse.json(payment);
  } catch (error) {
    if (error instanceof OrderFlowError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: "Nao foi possivel consultar o pagamento agora." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const body = await request.json();
    const parsed = confirmPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const order = await confirmOrderPayment(id, parsed.data.paymentCode);
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof OrderFlowError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: "Nao foi possivel confirmar o pagamento agora." },
      { status: 500 },
    );
  }
}
