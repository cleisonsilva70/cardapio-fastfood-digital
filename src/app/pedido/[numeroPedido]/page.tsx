import { PaymentOrderPanel } from "@/components/checkout/payment-order-panel";

type PedidoPageProps = {
  params: Promise<{ numeroPedido: string }>;
  searchParams: Promise<{
    orderId?: string;
    whatsapp?: string;
    paymentMethod?: "PIX" | "DINHEIRO" | "CARTAO_CREDITO" | "CARTAO_DEBITO";
    paymentCode?: string;
    provider?: string;
    status?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PedidoPage({
  params,
  searchParams,
}: PedidoPageProps) {
  const { numeroPedido } = await params;
  const { orderId, whatsapp, paymentMethod, paymentCode, provider, status } =
    await searchParams;

  return (
    <PaymentOrderPanel
      orderId={orderId}
      orderNumber={numeroPedido}
      whatsappUrl={whatsapp}
      paymentMethod={paymentMethod}
      paymentCode={paymentCode}
      paymentProvider={provider}
      gatewayStatus={status}
    />
  );
}
