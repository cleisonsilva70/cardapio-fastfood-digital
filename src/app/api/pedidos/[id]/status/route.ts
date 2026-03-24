import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/order-repository";
import { updateStatusSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const isAuthenticated = await isOwnerAuthenticated();

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Status invalido." }, { status: 400 });
  }

  const updatedOrder = await updateOrderStatus(id, parsed.data.status);

  if (!updatedOrder) {
    return NextResponse.json({ error: "Pedido nao encontrado." }, { status: 404 });
  }

  return NextResponse.json(updatedOrder);
}
