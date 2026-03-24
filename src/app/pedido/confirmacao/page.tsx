import { ConfirmOrderPanel } from "@/components/checkout/confirm-order-panel";

export const dynamic = "force-dynamic";

export default function ConfirmacaoPedidoPage() {
  return (
    <main className="container-shell py-10 pb-16">
      <ConfirmOrderPanel />
    </main>
  );
}
