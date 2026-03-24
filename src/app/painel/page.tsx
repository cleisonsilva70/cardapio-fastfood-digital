import { redirect } from "next/navigation";
import { CatalogManager } from "@/components/admin/catalog-manager";
import { isOwnerAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PainelPage() {
  const isAuthenticated = await isOwnerAuthenticated();

  if (!isAuthenticated) {
    redirect("/acesso-cozinha");
  }

  return (
    <main className="container-shell py-8 pb-16 sm:py-12">
      <CatalogManager />
    </main>
  );
}
