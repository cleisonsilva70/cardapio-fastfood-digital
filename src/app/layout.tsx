import type { Metadata } from "next";
import { BrandHeader } from "@/components/layout/brand-header";
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
        <BrandHeader />
        {children}
      </body>
    </html>
  );
}
