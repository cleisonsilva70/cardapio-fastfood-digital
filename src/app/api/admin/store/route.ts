import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import {
  getAdminStoreConfiguration,
  OrderFlowError,
  updateAdminStoreConfiguration,
} from "@/lib/order-repository";
import { adminStoreSettingsSchema } from "@/lib/validators";

export async function GET() {
  const isAuthenticated = await isOwnerAuthenticated();

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const data = await getAdminStoreConfiguration();
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const isAuthenticated = await isOwnerAuthenticated();

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = adminStoreSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      );
    }

    await updateAdminStoreConfiguration(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof OrderFlowError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: "Nao foi possivel salvar as configuracoes." },
      { status: 500 },
    );
  }
}
