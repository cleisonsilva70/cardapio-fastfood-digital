import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import { clearAllOrdersHistory, OrderFlowError } from "@/lib/order-repository";

export async function DELETE() {
  const isAuthenticated = await isOwnerAuthenticated();

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  try {
    const result = await clearAllOrdersHistory();
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
