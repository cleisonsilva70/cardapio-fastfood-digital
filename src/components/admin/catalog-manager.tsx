"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ExternalLink,
  ImagePlus,
  LayoutDashboard,
  Megaphone,
  Palette,
  Search,
  ShoppingBag,
  Store,
} from "lucide-react";
import { UploadField } from "@/components/admin/upload-field";
import { categoryLabels, orderStatusLabels } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { OrderStatus, ProductCategory } from "@/lib/types";

type AdminProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: ProductCategory;
  featured: boolean;
  active: boolean;
  displayOrder: number;
};

type AdminBanner = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaLabel: string;
  active: boolean;
  displayOrder: number;
};

type AdminStoreSettings = {
  name: string;
  shortName: string;
  logoText: string;
  logoPath: string;
  phoneDisplay: string;
  whatsappNumber: string;
  address: string;
  openingHours: string;
  deliveryFee: number;
  estimatedDeliveryMin: number;
  estimatedDeliveryMax: number;
  deliveryAreasText: string;
  heroTitle: string;
  heroDescription: string;
  eyebrow: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceColor: string;
};

type AdminOrder = {
  id: string;
  orderNumberFormatted: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  displayTime: string;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
  }>;
};

type PanelSection = "overview" | "store" | "products" | "banners" | "operation";

const emptyProductForm = {
  id: "",
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  category: "BURGERS" as ProductCategory,
  featured: false,
  active: true,
};

const emptyBannerForm = {
  id: "",
  title: "",
  description: "",
  imageUrl: "",
  ctaLabel: "",
  active: true,
};

const panelSections: {
  id: PanelSection;
  label: string;
  icon: LucideIcon;
  description: string;
}[] = [
  {
    id: "overview",
    label: "Visao geral",
    icon: LayoutDashboard,
    description: "Resumo da loja e atalhos de implantacao.",
  },
  {
    id: "store",
    label: "Loja e marca",
    icon: Store,
    description: "Nome, contato, hero, logo e cores.",
  },
  {
    id: "products",
    label: "Produtos",
    icon: ShoppingBag,
    description: "Cadastro e revisao do cardapio.",
  },
  {
    id: "banners",
    label: "Promocoes",
    icon: Megaphone,
    description: "Banners e chamadas da vitrine.",
  },
  {
    id: "operation",
    label: "Operacao",
    icon: Palette,
    description: "Links e checklist de entrega.",
  },
];

function PanelNav({
  activeSection,
  onChange,
}: {
  activeSection: PanelSection;
  onChange: (section: PanelSection) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {panelSections.map((section) => {
        const Icon = section.icon;
        const active = activeSection === section.id;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onChange(section.id)}
            className={`rounded-[24px] border p-4 text-left transition-all ${
              active
                ? "border-[var(--brand)] bg-[var(--brand)] text-white shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
                : "border-[var(--line)] bg-white/75 text-[var(--foreground)] hover:border-[var(--brand)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  active
                    ? "bg-white/16 text-white"
                    : "bg-[var(--surface-strong)] text-[var(--brand)]"
                }`}
              >
                <Icon size={20} />
              </div>
              <div>
                <p className="text-sm font-black uppercase">{section.label}</p>
                <p
                  className={`mt-1 text-xs leading-5 ${
                    active ? "text-white/85" : "text-[var(--muted)]"
                  }`}
                >
                  {section.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function StatusNotice({
  error,
  success,
}: {
  error: string;
  success: string;
}) {
  if (!error && !success) {
    return null;
  }

  return (
    <section className="panel-card p-5">
      {error ? (
        <p className="rounded-2xl border border-[rgba(179,63,47,0.22)] bg-[rgba(179,63,47,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-2xl border border-[rgba(39,147,108,0.22)] bg-[rgba(39,147,108,0.08)] px-4 py-3 text-sm text-[var(--success)]">
          {success}
        </p>
      ) : null}
    </section>
  );
}

export function CatalogManager() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [storeSettings, setStoreSettings] = useState<AdminStoreSettings | null>(null);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [bannerForm, setBannerForm] = useState(emptyBannerForm);
  const [activeSection, setActiveSection] = useState<PanelSection>("overview");
  const [productSearch, setProductSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [productsResponse, storeResponse, ordersResponse] = await Promise.all([
        fetch("/api/admin/products", { cache: "no-store" }),
        fetch("/api/admin/store", { cache: "no-store" }),
        fetch("/api/pedidos", { cache: "no-store" }),
      ]);
      const productsData = await productsResponse.json();
      const storeData = await storeResponse.json();
      const ordersData = await ordersResponse.json();

      if (!productsResponse.ok) {
        setError(productsData.error ?? "Nao foi possivel carregar os produtos.");
        return;
      }

      if (!storeResponse.ok) {
        setError(storeData.error ?? "Nao foi possivel carregar as configuracoes.");
        return;
      }

      if (!ordersResponse.ok) {
        setError(ordersData.error ?? "Nao foi possivel carregar o historico.");
        return;
      }

      setProducts(productsData);
      setStoreSettings(storeData.store);
      setBanners(storeData.banners);
      setOrders(ordersData);
    } catch {
      setError("Falha ao carregar os dados do painel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();

    if (!term) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        categoryLabels[product.category].toLowerCase().includes(term)
      );
    });
  }, [productSearch, products]);

  const activeProductsCount = useMemo(
    () => products.filter((product) => product.active).length,
    [products],
  );

  const featuredProductsCount = useMemo(
    () => products.filter((product) => product.featured).length,
    [products],
  );

  const activeBannersCount = useMemo(
    () => banners.filter((banner) => banner.active).length,
    [banners],
  );

  const deliveredOrdersCount = useMemo(
    () => orders.filter((order) => order.status === "ENTREGUE").length,
    [orders],
  );

  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);

  async function handleProductSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing = Boolean(productForm.id);
      const response = await fetch(
        isEditing
          ? `/api/admin/products/${productForm.id}`
          : "/api/admin/products",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: productForm.name,
            description: productForm.description,
            price: Number(productForm.price),
            imageUrl: productForm.imageUrl,
            category: productForm.category,
            featured: productForm.featured,
            active: productForm.active,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Nao foi possivel salvar o produto.");
        return;
      }

      setSuccess(isEditing ? "Produto atualizado." : "Produto criado.");
      setProductForm(emptyProductForm);
      await loadData();
      setActiveSection("products");
    } catch {
      setError("Falha ao salvar o produto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStoreSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!storeSettings) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeSettings),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Nao foi possivel salvar as configuracoes.");
        return;
      }

      setSuccess("Configuracoes da loja atualizadas.");
      await loadData();
      setActiveSection("store");
    } catch {
      setError("Falha ao salvar as configuracoes da loja.");
    } finally {
      setSaving(false);
    }
  }

  async function handleBannerSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing = Boolean(bannerForm.id);
      const response = await fetch(
        isEditing ? `/api/admin/banners/${bannerForm.id}` : "/api/admin/banners",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: bannerForm.title,
            description: bannerForm.description,
            imageUrl: bannerForm.imageUrl,
            ctaLabel: bannerForm.ctaLabel,
            active: bannerForm.active,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Nao foi possivel salvar o banner.");
        return;
      }

      setSuccess(isEditing ? "Banner atualizado." : "Banner criado.");
      setBannerForm(emptyBannerForm);
      await loadData();
      setActiveSection("banners");
    } catch {
      setError("Falha ao salvar o banner.");
    } finally {
      setSaving(false);
    }
  }

  function startEditProduct(product: AdminProduct) {
    setProductForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: String(product.price),
      imageUrl: product.imageUrl,
      category: product.category,
      featured: product.featured,
      active: product.active,
    });
    setActiveSection("products");
    setSuccess("");
    setError("");
  }

  function startEditBanner(banner: AdminBanner) {
    setBannerForm({
      id: banner.id,
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      ctaLabel: banner.ctaLabel,
      active: banner.active,
    });
    setActiveSection("banners");
    setSuccess("");
    setError("");
  }

  return (
    <div className="space-y-8">
      <section className="panel-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
              White-label
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase sm:text-4xl">
              Painel de criacao e edicao do cliente
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
              Organize a implantacao por etapas: primeiro a marca da loja,
              depois produtos e promocoes, e por fim a entrega operacional com
              links e painel da cozinha.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.14em]"
            >
              Ver vitrine
              <ExternalLink size={16} />
            </Link>
            <Link
              href="/cozinha"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white"
            >
              Abrir cozinha
            </Link>
          </div>
        </div>
      </section>

      <PanelNav activeSection={activeSection} onChange={setActiveSection} />
      <StatusNotice error={error} success={success} />

      {activeSection === "overview" ? (
        <div className="space-y-8">
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <article className="panel-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
                Produtos
              </p>
              <p className="mt-4 text-4xl font-black">{products.length}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Itens cadastrados para a loja atual.
              </p>
            </article>
            <article className="panel-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
                Ativos
              </p>
              <p className="mt-4 text-4xl font-black">{activeProductsCount}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Produtos visiveis para o cliente final.
              </p>
            </article>
            <article className="panel-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
                Destaques
              </p>
              <p className="mt-4 text-4xl font-black">{featuredProductsCount}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Itens marcados para chamar mais atencao.
              </p>
            </article>
            <article className="panel-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
                Banners
              </p>
              <p className="mt-4 text-4xl font-black">{activeBannersCount}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Promocoes ativas na vitrine principal.
              </p>
            </article>
            <article className="panel-card p-5 md:col-span-2 xl:col-span-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
                    Historico rapido
                  </p>
                  <p className="mt-4 text-4xl font-black">{orders.length}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {deliveredOrdersCount} pedidos ja foram concluidos nesta base.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {recentOrders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      className="rounded-[22px] border border-[var(--line)] bg-white/80 p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">
                        Pedido {order.orderNumberFormatted}
                      </p>
                      <p className="mt-2 text-sm font-bold">{order.customerName}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {order.displayTime} | {orderStatusLabels[order.status]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </section>

          <div className="grid gap-8 xl:grid-cols-[1fr_0.95fr]">
            <section className="panel-card p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
                Passo a passo
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase">
                Fluxo rapido de implantacao
              </h2>
              <div className="mt-8 grid gap-4">
                {[
                  "Atualize nome, WhatsApp, horario e logo da hamburgueria.",
                  "Cadastre os produtos reais e confirme categorias e precos.",
                  "Suba banners promocionais com chamadas curtas e objetivas.",
                  "Teste um pedido completo e confirme a mensagem no WhatsApp.",
                  "Entregue ao cliente o link da vitrine e a senha da cozinha.",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="flex gap-4 rounded-[22px] border border-[var(--line)] bg-white/80 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand)] text-sm font-black text-white">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-7 text-[var(--muted)]">{step}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel-card p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
                Loja atual
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase">
                Resumo da configuracao
              </h2>
              {loading || !storeSettings ? (
                <div className="mt-6 rounded-[22px] border border-dashed border-[var(--line)] bg-white/60 p-5 text-sm text-[var(--muted)]">
                  Carregando dados da loja...
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <div className="rounded-[22px] border border-[var(--line)] bg-white/80 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-strong)]">
                      Marca
                    </p>
                    <h3 className="mt-3 text-2xl font-black uppercase">
                      {storeSettings.name}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {storeSettings.phoneDisplay} | {storeSettings.openingHours}
                    </p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Entrega base: {formatCurrency(storeSettings.deliveryFee)} |{" "}
                      {storeSettings.estimatedDeliveryMin}-{storeSettings.estimatedDeliveryMax} min
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--line)] bg-white/80 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-strong)]">
                      Hero atual
                    </p>
                    <h3 className="mt-3 text-xl font-black uppercase">
                      {storeSettings.heroTitle}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                      {storeSettings.heroDescription}
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}

      {activeSection === "store" ? (
        <section className="panel-card p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
            Loja e marca
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase">
            Dados da hamburgueria e identidade visual
          </h2>

          {storeSettings ? (
            <form onSubmit={handleStoreSubmit} className="mt-8 space-y-8">
              <div className="grid gap-8 lg:grid-cols-2">
                <section className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold">Nome da loja</span>
                      <input
                        value={storeSettings.name}
                        onChange={(event) =>
                          setStoreSettings((current) =>
                            current ? { ...current, name: event.target.value } : current,
                          )
                        }
                        className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold">Nome curto</span>
                      <input
                        value={storeSettings.shortName}
                        onChange={(event) =>
                          setStoreSettings((current) =>
                            current ? { ...current, shortName: event.target.value } : current,
                          )
                        }
                        className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold">Telefone exibido</span>
                      <input
                        value={storeSettings.phoneDisplay}
                        onChange={(event) =>
                          setStoreSettings((current) =>
                            current
                              ? { ...current, phoneDisplay: event.target.value }
                              : current,
                          )
                        }
                        className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold">WhatsApp numerico</span>
                      <input
                        value={storeSettings.whatsappNumber}
                        onChange={(event) =>
                          setStoreSettings((current) =>
                            current
                              ? { ...current, whatsappNumber: event.target.value }
                              : current,
                          )
                        }
                        className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold">Horario</span>
                      <input
                        value={storeSettings.openingHours}
                        onChange={(event) =>
                          setStoreSettings((current) =>
                            current
                              ? { ...current, openingHours: event.target.value }
                              : current,
                          )
                        }
                        className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold">Taxa base</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={storeSettings.deliveryFee}
                        onChange={(event) =>
                          setStoreSettings((current) =>
                            current
                              ? {
                                  ...current,
                                  deliveryFee: Number(event.target.value),
                                }
                              : current,
                          )
                        }
                        className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold">Eyebrow</span>
                      <input
                        value={storeSettings.eyebrow}
                        onChange={(event) =>
                          setStoreSettings((current) =>
                            current ? { ...current, eyebrow: event.target.value } : current,
                          )
                        }
                        className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                      />
                    </label>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold">Endereco</span>
                    <input
                      value={storeSettings.address}
                      onChange={(event) =>
                        setStoreSettings((current) =>
                          current ? { ...current, address: event.target.value } : current,
                        )
                      }
                      className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                    />
                  </label>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold">Iniciais da marca</span>
                      <input
                        value={storeSettings.logoText}
                        onChange={(event) =>
                          setStoreSettings((current) =>
                            current
                              ? {
                                  ...current,
                                  logoText: event.target.value.toUpperCase(),
                                }
                              : current,
                          )
                        }
                        className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                      />
                    </label>

                    <UploadField
                      label="Logo da loja"
                      scope="branding"
                      value={storeSettings.logoPath}
                      onChange={(value) =>
                        setStoreSettings((current) =>
                          current ? { ...current, logoPath: value } : current,
                        )
                      }
                    />
                  </div>
                </section>

                <section className="space-y-5">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold">Hero title</span>
                    <input
                      value={storeSettings.heroTitle}
                      onChange={(event) =>
                        setStoreSettings((current) =>
                          current
                            ? { ...current, heroTitle: event.target.value }
                            : current,
                        )
                      }
                      className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold">Hero description</span>
                    <textarea
                      value={storeSettings.heroDescription}
                      onChange={(event) =>
                        setStoreSettings((current) =>
                          current
                            ? { ...current, heroDescription: event.target.value }
                            : current,
                        )
                      }
                      rows={4}
                      className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold">Tagline</span>
                    <textarea
                      value={storeSettings.tagline}
                      onChange={(event) =>
                        setStoreSettings((current) =>
                          current ? { ...current, tagline: event.target.value } : current,
                        )
                      }
                      rows={3}
                      className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                    />
                  </label>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold">Tempo minimo (min)</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={storeSettings.estimatedDeliveryMin}
                        onChange={(event) =>
                          setStoreSettings((current) =>
                            current
                              ? {
                                  ...current,
                                  estimatedDeliveryMin: Number(event.target.value),
                                }
                              : current,
                          )
                        }
                        className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold">Tempo maximo (min)</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={storeSettings.estimatedDeliveryMax}
                        onChange={(event) =>
                          setStoreSettings((current) =>
                            current
                              ? {
                                  ...current,
                                  estimatedDeliveryMax: Number(event.target.value),
                                }
                              : current,
                          )
                        }
                        className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                      />
                    </label>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold">Bairros de entrega</span>
                    <textarea
                      value={storeSettings.deliveryAreasText}
                      onChange={(event) =>
                        setStoreSettings((current) =>
                          current
                            ? { ...current, deliveryAreasText: event.target.value }
                            : current,
                        )
                      }
                      rows={7}
                      className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                    />
                    <p className="text-xs leading-6 text-[var(--muted)]">
                      Use uma linha por bairro no formato:
                      <br />
                      Bairro|Taxa|TempoMin|TempoMax
                    </p>
                  </label>

                  <div className="rounded-[26px] border border-[var(--line)] bg-[var(--surface-strong)] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand)] text-white">
                        <ImagePlus size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase">Cores da loja</p>
                        <p className="text-xs text-[var(--muted)]">
                          Atualize a identidade visual da hamburgueria.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                      <label className="block space-y-2">
                        <span className="text-sm font-semibold">Principal</span>
                        <input
                          type="color"
                          value={storeSettings.primaryColor}
                          onChange={(event) =>
                            setStoreSettings((current) =>
                              current
                                ? { ...current, primaryColor: event.target.value }
                                : current,
                            )
                          }
                          className="h-12 w-full rounded-2xl border border-[var(--line)] bg-white px-2 py-2"
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-sm font-semibold">Secundaria</span>
                        <input
                          type="color"
                          value={storeSettings.secondaryColor}
                          onChange={(event) =>
                            setStoreSettings((current) =>
                              current
                                ? { ...current, secondaryColor: event.target.value }
                                : current,
                            )
                          }
                          className="h-12 w-full rounded-2xl border border-[var(--line)] bg-white px-2 py-2"
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-sm font-semibold">Accent</span>
                        <input
                          type="color"
                          value={storeSettings.accentColor}
                          onChange={(event) =>
                            setStoreSettings((current) =>
                              current
                                ? { ...current, accentColor: event.target.value }
                                : current,
                            )
                          }
                          className="h-12 w-full rounded-2xl border border-[var(--line)] bg-white px-2 py-2"
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-sm font-semibold">Surface</span>
                        <input
                          type="color"
                          value={storeSettings.surfaceColor}
                          onChange={(event) =>
                            setStoreSettings((current) =>
                              current
                                ? { ...current, surfaceColor: event.target.value }
                                : current,
                            )
                          }
                          className="h-12 w-full rounded-2xl border border-[var(--line)] bg-white px-2 py-2"
                        />
                      </label>
                    </div>
                  </div>
                </section>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[var(--brand)] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[var(--brand-strong)]"
              >
                {saving ? "Salvando..." : "Salvar configuracoes da loja"}
              </button>
            </form>
          ) : (
            <div className="mt-6 rounded-[22px] border border-dashed border-[var(--line)] bg-white/60 p-5 text-sm text-[var(--muted)]">
              Carregando configuracoes da loja...
            </div>
          )}
        </section>
      ) : null}

      {activeSection === "products" ? (
        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="panel-card p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
              Cadastro
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase">
              Criar ou editar produto
            </h2>
            <form onSubmit={handleProductSubmit} className="mt-8 space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-semibold">Nome</span>
                <input
                  required
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold">Descricao</span>
                <textarea
                  required
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold">Preco</span>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={productForm.price}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold">Categoria</span>
                  <select
                    value={productForm.category}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        category: event.target.value as ProductCategory,
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <UploadField
                label="Imagem do produto"
                scope="products"
                value={productForm.imageUrl}
                onChange={(value) =>
                  setProductForm((current) => ({ ...current, imageUrl: value }))
                }
              />

              <div className="flex flex-wrap gap-5">
                <label className="inline-flex items-center gap-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={productForm.featured}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        featured: event.target.checked,
                      }))
                    }
                  />
                  Produto em destaque
                </label>

                <label className="inline-flex items-center gap-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={productForm.active}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        active: event.target.checked,
                      }))
                    }
                  />
                  Produto ativo
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[var(--brand)] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[var(--brand-strong)]"
                >
                  {saving
                    ? "Salvando..."
                    : productForm.id
                      ? "Atualizar produto"
                      : "Criar produto"}
                </button>
                {productForm.id ? (
                  <button
                    type="button"
                    onClick={() => setProductForm(emptyProductForm)}
                    className="rounded-full border border-[var(--line)] bg-white/80 px-6 py-4 text-sm font-bold uppercase tracking-[0.16em]"
                  >
                    Cancelar edicao
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="panel-card p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
                  Lista atual
                </p>
                <h2 className="mt-2 text-3xl font-black uppercase">
                  Produtos cadastrados
                </h2>
              </div>

              <label className="relative block w-full max-w-md">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                />
                <input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Buscar por nome, descricao ou categoria"
                  className="w-full rounded-full border border-[var(--line)] bg-white py-3 pl-11 pr-4 text-sm"
                />
              </label>
            </div>

            <div className="mt-6 space-y-4">
              {loading ? (
                <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-white/60 p-5 text-sm text-[var(--muted)]">
                  Carregando produtos...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-white/60 p-5 text-sm text-[var(--muted)]">
                  Nenhum produto encontrado.
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <article
                    key={product.id}
                    className="rounded-[22px] border border-[var(--line)] bg-white/80 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black">{product.name}</h3>
                          {product.featured ? (
                            <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]">
                              Destaque
                            </span>
                          ) : null}
                          {!product.active ? (
                            <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                              Inativo
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          {product.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--muted)]">
                          <span>{categoryLabels[product.category]}</span>
                          <span>{formatCurrency(product.price)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => startEditProduct(product)}
                        className="rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-bold uppercase tracking-[0.12em]"
                      >
                        Editar
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      ) : null}

      {activeSection === "banners" ? (
        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="panel-card p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
              Promocoes
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase">
              Criar ou editar banner
            </h2>

            <form onSubmit={handleBannerSubmit} className="mt-8 space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-semibold">Titulo</span>
                <input
                  value={bannerForm.title}
                  onChange={(event) =>
                    setBannerForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold">Descricao</span>
                <textarea
                  value={bannerForm.description}
                  onChange={(event) =>
                    setBannerForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                />
              </label>
              <UploadField
                label="Imagem do banner"
                scope="banners"
                value={bannerForm.imageUrl}
                onChange={(value) =>
                  setBannerForm((current) => ({ ...current, imageUrl: value }))
                }
              />
              <label className="block space-y-2">
                <span className="text-sm font-semibold">Texto do botao</span>
                <input
                  value={bannerForm.ctaLabel}
                  onChange={(event) =>
                    setBannerForm((current) => ({
                      ...current,
                      ctaLabel: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                />
              </label>
              <label className="inline-flex items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={bannerForm.active}
                  onChange={(event) =>
                    setBannerForm((current) => ({
                      ...current,
                      active: event.target.checked,
                    }))
                  }
                />
                Banner ativo
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[var(--brand)] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[var(--brand-strong)]"
                >
                  {saving
                    ? "Salvando..."
                    : bannerForm.id
                      ? "Atualizar banner"
                      : "Criar banner"}
                </button>
                {bannerForm.id ? (
                  <button
                    type="button"
                    onClick={() => setBannerForm(emptyBannerForm)}
                    className="rounded-full border border-[var(--line)] bg-white/80 px-6 py-4 text-sm font-bold uppercase tracking-[0.16em]"
                  >
                    Cancelar edicao
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="panel-card p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
              Vitrine
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase">
              Banners cadastrados
            </h2>
            <div className="mt-6 space-y-4">
              {banners.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-white/60 p-5 text-sm text-[var(--muted)]">
                  Nenhum banner cadastrado.
                </div>
              ) : (
                banners.map((banner) => (
                  <article
                    key={banner.id}
                    className="rounded-[22px] border border-[var(--line)] bg-white/80 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black">{banner.title}</h3>
                          {!banner.active ? (
                            <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                              Inativo
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          {banner.description}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--brand)]">
                          {banner.ctaLabel}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startEditBanner(banner)}
                        className="rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-bold uppercase tracking-[0.12em]"
                      >
                        Editar
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      ) : null}

      {activeSection === "operation" ? (
        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="panel-card p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
              Entrega
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase">
              O que passar para o cliente
            </h2>
            <div className="mt-8 space-y-4">
              {[
                "Link principal da vitrine para enviar no Instagram, WhatsApp e bio.",
                "Link do acesso da cozinha para a operacao do dono.",
                "Senha da cozinha definida por voce para esse cliente.",
                "Orientacao curta de como testar um pedido e acompanhar o status.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[22px] border border-[var(--line)] bg-white/80 p-4 text-sm leading-7 text-[var(--muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="panel-card p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
              Links
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase">
              Acessos operacionais
            </h2>

            <div className="mt-8 grid gap-4">
              {[
                {
                  label: "Vitrine principal",
                  href: "/",
                  note: "Link que vai para o cliente final.",
                },
                {
                  label: "Checkout",
                  href: "/checkout",
                  note: "Resumo do pedido e formulario de entrega.",
                },
                {
                  label: "Login da cozinha",
                  href: "/acesso-cozinha",
                  note: "Entrada protegida para o proprietario.",
                },
                {
                  label: "Painel da cozinha",
                  href: "/cozinha",
                  note: "Fluxo operacional dos pedidos apos login.",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  className="rounded-[22px] border border-[var(--line)] bg-white/80 p-5 transition-colors hover:border-[var(--brand)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {item.note}
                      </p>
                    </div>
                    <ExternalLink size={18} className="text-[var(--brand)]" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="panel-card p-6 sm:p-8 xl:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
                  Historico
                </p>
                <h2 className="mt-2 text-3xl font-black uppercase">
                  Pedidos recentes
                </h2>
              </div>
              <Link
                href="/cozinha"
                className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.14em]"
              >
                Abrir painel da cozinha
              </Link>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {recentOrders.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-white/60 p-5 text-sm text-[var(--muted)] lg:col-span-2">
                  Nenhum pedido registrado ainda.
                </div>
              ) : (
                recentOrders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-[22px] border border-[var(--line)] bg-white/80 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">
                          Pedido {order.orderNumberFormatted}
                        </p>
                        <h3 className="mt-2 text-lg font-black">{order.customerName}</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {order.displayTime}
                        </p>
                      </div>
                      <span className="rounded-full bg-[var(--surface-strong)] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em]">
                        {orderStatusLabels[order.status]}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                      {order.items.slice(0, 3).map((item) => (
                        <p key={item.id}>
                          {item.quantity}x {item.productName}
                        </p>
                      ))}
                      {order.items.length > 3 ? (
                        <p>+ {order.items.length - 3} item(ns)</p>
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-[18px] bg-[var(--surface)] px-4 py-3">
                      <span className="text-sm text-[var(--muted)]">Total</span>
                      <strong className="text-[var(--brand)]">
                        {formatCurrency(order.total)}
                      </strong>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
