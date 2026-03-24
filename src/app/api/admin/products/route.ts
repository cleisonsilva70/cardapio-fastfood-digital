import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import {
  listAdminProducts,
  OrderFlowError,
  upsertAdminProduct,
} from "@/lib/order-repository";
import { adminProductSchema } from "@/lib/validators";

export async function GET() {
  const isAuthenticated = await isOwnerAuthenticated();

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const products = await listAdminProducts();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const isAuthenticated = await isOwnerAuthenticated();

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = adminProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      );
    }

    const product = await upsertAdminProduct(parsed.data);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof OrderFlowError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: "Nao foi possivel salvar o produto." },
      { status: 500 },
    );
  }
}
