import { redirect } from "next/navigation";
import { OwnerLoginForm } from "@/components/cozinha/owner-login-form";
import { isOwnerAuthenticated } from "@/lib/auth";

export default async function AcessoCozinhaPage() {
  const isAuthenticated = await isOwnerAuthenticated();

  if (isAuthenticated) {
    redirect("/cozinha");
  }

  return (
    <main className="container-shell py-10 pb-16">
      <OwnerLoginForm />
    </main>
  );
}
