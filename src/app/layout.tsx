import type { Metadata } from "next";
import {
  getResolvedBrandingConfig,
  getResolvedStoreConfig,
  getThemeStyleVariables,
} from "@/lib/white-label";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [store, branding] = await Promise.all([
    getResolvedStoreConfig(),
    getResolvedBrandingConfig(),
  ]);

  return {
    title: store.name,
    description: branding.heroDescription,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await getResolvedBrandingConfig();

  return (
    <html lang="pt-BR">
      <body style={getThemeStyleVariables(branding)}>
        <div className="relative isolate overflow-x-clip pb-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[-1] h-[220px] bg-[linear-gradient(180deg,rgba(255,255,255,0.58),transparent)]" />
          {children}
        </div>
      </body>
    </html>
  );
}
