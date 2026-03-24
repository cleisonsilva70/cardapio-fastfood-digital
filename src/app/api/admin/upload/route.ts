import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { isOwnerAuthenticated } from "@/lib/auth";

const allowedScopes = new Set(["branding", "products", "banners"]);
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "-").toLowerCase();
}

export async function POST(request: Request) {
  const isAuthenticated = await isOwnerAuthenticated();

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const scope = String(formData.get("scope") ?? "branding");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo nao enviado." }, { status: 400 });
  }

  if (!allowedScopes.has(scope)) {
    return NextResponse.json({ error: "Destino de upload invalido." }, { status: 400 });
  }

  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json({ error: "Tipo de arquivo nao suportado." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = `${randomUUID()}-${sanitizeFileName(file.name)}`;
  const directory = path.join(process.cwd(), "public", "uploads", scope);

  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, fileName), buffer);

  return NextResponse.json({
    url: `/uploads/${scope}/${fileName}`,
  });
}
