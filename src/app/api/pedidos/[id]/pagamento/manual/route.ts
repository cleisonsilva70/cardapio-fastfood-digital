import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import { markOrderAsPaid, OrderFlowError } from "@/lib/order-repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  const isAuthenticated = await isOwnerAuthenticated();

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const order = await markOrderAsPaid(id);
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof OrderFlowError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: "Nao foi possivel confirmar o pagamento manualmente." },
      { status: 500 },
    );
  }
}
