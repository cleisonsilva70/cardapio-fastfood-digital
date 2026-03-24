import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";
import {
  getAdminStoreConfiguration,
  OrderFlowError,
  upsertAdminBanner,
} from "@/lib/order-repository";
import { adminBannerSchema } from "@/lib/validators";

export async function GET() {
  const isAuthenticated = await isOwnerAuthenticated();

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const data = await getAdminStoreConfiguration();
  return NextResponse.json(data.banners);
}

export async function POST(request: Request) {
  const isAuthenticated = await isOwnerAuthenticated();

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = adminBannerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      );
    }

    const banner = await upsertAdminBanner(parsed.data);
    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    if (error instanceof OrderFlowError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: "Nao foi possivel salvar o banner." },
      { status: 500 },
    );
  }
}
