import { redirect } from "next/navigation";
import { ServiceBoard } from "@/components/atendimento/service-board";
import { isOwnerAuthenticated } from "@/lib/auth";
import { listPendingPaymentOrders } from "@/lib/order-repository";

export const dynamic = "force-dynamic";

export default async function AtendimentoPage() {
  const isAuthenticated = await isOwnerAuthenticated();

  if (!isAuthenticated) {
    redirect("/acesso-cozinha");
  }

  const orders = await listPendingPaymentOrders();

  return (
    <main className="container-shell py-8 pb-16 sm:py-12">
      <ServiceBoard initialOrders={orders} />
    </main>
  );
}
