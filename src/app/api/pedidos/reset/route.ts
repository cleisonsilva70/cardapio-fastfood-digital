import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import { clearAllOrdersHistory, OrderFlowError } from "@/lib/order-repository";

export async function DELETE(request: Request) {
  const isAuthenticated = await isOwnerAuthenticated();

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  try {
    let orderIds: string[] | undefined;

    try {
      const body = await request.json();
      orderIds = Array.isArray(body?.orderIds)
        ? body.orderIds.filter((value: unknown): value is string => typeof value === "string")
        : undefined;
    } catch {
      orderIds = undefined;
    }

    const result = await clearAllOrdersHistory(orderIds);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof OrderFlowError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: "Nao foi possivel arquivar todo o historico agora." },
      { status: 500 },
    );
  }
}
