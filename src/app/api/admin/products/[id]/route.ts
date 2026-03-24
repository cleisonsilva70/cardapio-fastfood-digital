import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import {
  OrderFlowError,
  upsertAdminProduct,
} from "@/lib/order-repository";
import { adminProductSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const isAuthenticated = await isOwnerAuthenticated();

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = adminProductSchema.safeParse({ ...body, id });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      );
    }

    const product = await upsertAdminProduct(parsed.data);
    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof OrderFlowError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: "Nao foi possivel atualizar o produto." },
      { status: 500 },
    );
  }
}
