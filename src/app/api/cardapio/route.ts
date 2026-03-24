import { NextResponse } from "next/server";
import { listProducts } from "@/lib/order-repository";

export async function GET() {
  const products = await listProducts();
  return NextResponse.json(products);
}
