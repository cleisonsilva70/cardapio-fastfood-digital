import { redirect } from "next/navigation";
import { KitchenBoard } from "@/components/cozinha/kitchen-board";
import { isOwnerAuthenticated } from "@/lib/auth";
import { listKitchenOrders } from "@/lib/order-repository";

export const dynamic = "force-dynamic";

export default async function CozinhaPage() {
  const isAuthenticated = await isOwnerAuthenticated();

  if (!isAuthenticated) {
    redirect("/acesso-cozinha");
  }

  const orders = await listKitchenOrders();

  return (
    <main className="container-shell py-8 pb-16 sm:py-12">
      <KitchenBoard initialOrders={orders} />
    </main>
  );
}
