"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  Copy,
  ExternalLink,
  ImagePlus,
  LayoutDashboard,
  Megaphone,
  Palette,
  Search,
  ShoppingBag,
  Store,
  Trash2,
} from "lucide-react";
import { UploadField } from "@/components/admin/upload-field";
import { formatCategoryLabel, orderStatusLabels } from "@/lib/constants";
import { formatCurrency, formatDateTimeLabel } from "@/lib/format";
import type { OrderStatus, ProductCategory, StoreCategory } from "@/lib/types";

type AdminProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: ProductCategory;
  compositionText: string;
  sizeOptionsText: string;
  optionalItemsText: string;
  allowCustomerNote: boolean;
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
  ctaMode: "LINK" | "ADD_TO_CART";
  ctaHref: string;
  ctaProductId: string;
  campaignBadge: string;
  highlighted: boolean;
  startsAt: string;
  endsAt: string;
  active: boolean;
  displayOrder: number;
};

type BannerFormState = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaLabel: string;
  ctaMode: "LINK" | "ADD_TO_CART";
  ctaHref: string;
  ctaProductId: string;
  campaignBadge: string;
  highlighted: boolean;
  startsAt: string;
  endsAt: string;
  displayOrder: string;
  active: boolean;
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
  paymentStatus: "PENDENTE" | "PAGO" | "FALHOU" | "CANCELADO";
  total: number;
  displayTime: string;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
  }>;
};

type AdminCategory = StoreCategory;

type CategoryFormState = {
  id: string;
  name: string;
  displayOrder: string;
  active: boolean;
};

type PanelSection = "overview" | "store" | "products" | "banners" | "operation";

const emptyProductForm = {
  id: "",
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  category: "Burgers" as ProductCategory,
  compositionText: "",
  sizeOptionsText: "",
  optionalItemsText: "",
  allowCustomerNote: false,
  featured: false,
  active: true,
};

const emptyBannerForm: BannerFormState = {
  id: "",
  title: "",
  description: "",
  imageUrl: "",
  ctaLabel: "",
  ctaMode: "LINK",
  ctaHref: "#cardapio",
  ctaProductId: "",
  campaignBadge: "",
  highlighted: false,
  startsAt: "",
  endsAt: "",
  displayOrder: "1",
  active: true,
};

const emptyCategoryForm: CategoryFormState = {
  id: "",
  name: "",
  displayOrder: "1",
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
                ? "border-[var(--brand)] bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] text-white shadow-[0_16px_40px_rgba(145,47,18,0.18)]"
                : "border-[var(--line)] bg-white/75 text-[var(--foreground)] hover:border-[var(--brand)] hover:-translate-y-0.5"
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
    <section className="panel-card luxury-section p-5">
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
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [storeSettings, setStoreSettings] = useState<AdminStoreSettings | null>(null);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [bannerForm, setBannerForm] = useState(emptyBannerForm);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [activeSection, setActiveSection] = useState<PanelSection>("overview");
  const [productSearch, setProductSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<OrderStatus | "TODOS">(
    "TODOS",
  );
  const [appOrigin, setAppOrigin] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingOrders, setResettingOrders] = useState(false);

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
      setCategories(storeData.categories ?? []);
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (categories.length === 0) {
      return;
    }

    setCategoryForm((current) =>
      current.id || current.name
        ? current
        : { ...current, displayOrder: String(categories.length + 1) },
    );

    setProductForm((current) =>
      current.category
        ? current
        : { ...current, category: categories[0]?.name ?? "" },
    );
  }, [categories]);

  useEffect(() => {
    if (banners.length === 0) {
      return;
    }

    setBannerForm((current) =>
      current.id || current.title
        ? current
        : { ...current, displayOrder: String(banners.length + 1) },
    );
  }, [banners]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();

    if (!term) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        formatCategoryLabel(product.category).toLowerCase().includes(term)
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

  const filteredOrderHistory = useMemo(() => {
    const term = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        historyStatusFilter === "TODOS" || order.status === historyStatusFilter;

      const matchesSearch =
        !term ||
        order.customerName.toLowerCase().includes(term) ||
        order.orderNumberFormatted.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [historyStatusFilter, orderSearch, orders]);

  const operationLinks = useMemo(
    () => [
      {
        key: "vitrine",
        label: "Vitrine principal",
        href: `${appOrigin}/`,
        note: "Link que vai para o cliente final.",
      },
      {
        key: "checkout",
        label: "Checkout",
        href: `${appOrigin}/checkout`,
        note: "Resumo do pedido e formulario de entrega.",
      },
      {
        key: "atendimento",
        label: "Painel de atendimento",
        href: `${appOrigin}/atendimento`,
        note: "Confirma pagamento e libera para a cozinha.",
      },
      {
        key: "login",
        label: "Login da cozinha",
        href: `${appOrigin}/acesso-cozinha`,
        note: "Entrada protegida para o proprietario.",
      },
      {
        key: "cozinha",
        label: "Painel da cozinha",
        href: `${appOrigin}/cozinha`,
        note: "Fluxo operacional dos pedidos apos login.",
      },
    ],
    [appOrigin],
  );

  const clientDeliveryMessage = useMemo(() => {
    const storeName = storeSettings?.name ?? "Sua hamburgueria";

    return [
      `Segue o acesso ao cardapio digital da ${storeName}:`,
      "",
      `Cardapio: ${appOrigin}/`,
      `Atendimento interno: ${appOrigin}/atendimento`,
      `Cozinha: ${appOrigin}/acesso-cozinha`,
      "",
      "Fluxo rapido:",
      "- o cliente faz o pedido pelo cardapio",
      "- o pedido chega no atendimento",
      "- a equipe confirma o pagamento",
      "- a cozinha recebe o pedido para preparo",
      "",
      "Senha da cozinha: [definir com o cliente]",
    ].join("\n");
  }, [appOrigin, storeSettings?.name]);

  async function copyText(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? "" : current));
      }, 1800);
    } catch {
      setError("Nao foi possivel copiar agora.");
    }
  }

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
            compositionText: productForm.compositionText,
            sizeOptionsText: productForm.sizeOptionsText,
            optionalItemsText: productForm.optionalItemsText,
            allowCustomerNote: productForm.allowCustomerNote,
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

  async function handleCategorySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isEditing = Boolean(categoryForm.id);
      const response = await fetch(
        isEditing
          ? `/api/admin/categories/${categoryForm.id}`
          : "/api/admin/categories",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: categoryForm.name,
            displayOrder: Number(categoryForm.displayOrder),
            active: categoryForm.active,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Nao foi possivel salvar a categoria.");
        return;
      }

      setSuccess(isEditing ? "Categoria atualizada." : "Categoria criada.");
      setCategoryForm({
        ...emptyCategoryForm,
        displayOrder: String((categories.length || 0) + 1),
      });
      await loadData();
      setActiveSection("products");
    } catch {
      setError("Falha ao salvar a categoria.");
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
            ctaMode: bannerForm.ctaMode,
            ctaHref: bannerForm.ctaHref,
            ctaProductId: bannerForm.ctaProductId,
            campaignBadge: bannerForm.campaignBadge,
            highlighted: bannerForm.highlighted,
            startsAt: bannerForm.startsAt,
            endsAt: bannerForm.endsAt,
            displayOrder: Number(bannerForm.displayOrder),
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
      setBannerForm({
        ...emptyBannerForm,
        displayOrder: String((banners.length || 0) + (isEditing ? 0 : 1)),
      });
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
        compositionText: product.compositionText,
        sizeOptionsText: product.sizeOptionsText,
        optionalItemsText: product.optionalItemsText,
        allowCustomerNote: product.allowCustomerNote,
        featured: product.featured,
        active: product.active,
      });
    setActiveSection("products");
    setSuccess("");
    setError("");
  }

  function startEditCategory(category: AdminCategory) {
    setCategoryForm({
      id: category.id,
      name: category.name,
      displayOrder: String(category.displayOrder),
      active: category.active,
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
        ctaMode: banner.ctaMode,
        ctaHref: banner.ctaHref,
        ctaProductId: banner.ctaProductId,
        campaignBadge: banner.campaignBadge,
        highlighted: banner.highlighted,
        startsAt: banner.startsAt ? banner.startsAt.slice(0, 16) : "",
        endsAt: banner.endsAt ? banner.endsAt.slice(0, 16) : "",
        displayOrder: String(banner.displayOrder),
        active: banner.active,
      });
    setActiveSection("banners");
    setSuccess("");
    setError("");
  }

  async function archiveAllOrderHistory() {
    const confirmed = window.confirm(
      "Isso vai arquivar todos os pedidos visiveis no historico atual. A numeracao dos pedidos sera mantida. Deseja continuar?",
    );

    if (!confirmed) {
      return;
    }

    setResettingOrders(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/pedidos/reset", {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Nao foi possivel arquivar o historico de pedidos.");
        return;
      }

      await loadData();
      setOrderSearch("");
      setHistoryStatusFilter("TODOS");
      setSuccess(
        data.cleared > 0
          ? `${data.cleared} pedidos arquivados com sucesso.`
          : "Nao havia pedidos ativos para arquivar.",
      );
    } catch {
      setError("Falha ao arquivar todo o historico de pedidos.");
    } finally {
        setResettingOrders(false);
      }
  }

  return (
    <div className="space-y-8">
      <section className="panel-card luxury-section overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="glass-pill inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
              White-label
            </p>
            <h1 className="mt-4 text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl">
              Central de implantacao e gestao da loja
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              Organize a implantacao por etapas: primeiro a marca da loja,
              depois produtos e promocoes, e por fim a entrega operacional com
              links e painel da cozinha.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {[
                "Base pronta para replicar clientes",
                "Operacao separada entre atendimento e cozinha",
                "Edicao rapida de cardapio e banners",
              ].map((item) => (
                <span
                  key={item}
                  className="glass-pill inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[rgba(34,19,13,0.08)] bg-[linear-gradient(180deg,var(--surface-dark),#1b100b)] p-5 text-white shadow-[0_20px_38px_rgba(34,19,13,0.18)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
              Acesso rapido
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <Link
                href="/"
                target="_blank"
                className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4 transition-colors hover:bg-white/12"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                  Vitrine
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-bold uppercase">Ver loja</span>
                  <ExternalLink size={16} />
                </div>
              </Link>
              <Link
                href="/atendimento"
                className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4 transition-colors hover:bg-white/12"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                  Atendimento
                </p>
                <p className="mt-2 text-sm font-bold uppercase">Liberar pedidos</p>
              </Link>
              <Link
                href="/cozinha"
                className="rounded-[22px] border border-white/10 bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] px-4 py-4 shadow-[0_16px_26px_rgba(145,47,18,0.2)]"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">
                  Cozinha
                </p>
                <p className="mt-2 text-sm font-bold uppercase">Abrir operacao</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PanelNav activeSection={activeSection} onChange={setActiveSection} />
      <StatusNotice error={error} success={success} />

      {activeSection === "overview" ? (
        <div className="space-y-8">
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <article className="panel-card luxury-section p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
                Produtos
              </p>
              <p className="mt-4 text-4xl font-black">{products.length}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Itens cadastrados no cardapio desta hamburgueria.
              </p>
            </article>
            <article className="panel-card luxury-section p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
                Ativos
              </p>
              <p className="mt-4 text-4xl font-black">{activeProductsCount}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Produtos publicados e visiveis para o cliente final.
              </p>
            </article>
            <article className="panel-card luxury-section p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
                Destaques
              </p>
              <p className="mt-4 text-4xl font-black">{featuredProductsCount}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Itens destacados para puxar mais cliques e vendas.
              </p>
            </article>
            <article className="panel-card luxury-section p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
                Banners
              </p>
              <p className="mt-4 text-4xl font-black">{activeBannersCount}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Banners ativos na vitrine principal da loja.
              </p>
            </article>
          </section>

          <div className="grid gap-8 xl:grid-cols-[1fr_0.95fr]">
            <section className="panel-card luxury-section p-6 sm:p-8">
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

            <section className="panel-card luxury-section p-6 sm:p-8">
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
        <section className="panel-card luxury-section p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
            Loja e marca
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase">
            Dados da hamburgueria e identidade visual
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            Ajuste nome, contato, promessa principal da vitrine e identidade
            visual da loja em um so lugar.
          </p>

          {storeSettings ? (
            <form onSubmit={handleStoreSubmit} className="mt-8 space-y-8">
              <div className="grid gap-8 lg:grid-cols-2">
                <section className="panel-subtle space-y-5 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
                      Dados principais
                    </p>
                    <h3 className="mt-2 text-xl font-black uppercase">
                      Informacoes da loja
                    </h3>
                  </div>
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

                <section className="panel-subtle space-y-5 p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
                      Vitrine
                    </p>
                    <h3 className="mt-2 text-xl font-black uppercase">
                      Hero, entrega e cores
                    </h3>
                  </div>
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
                className="rounded-full bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_18px_30px_rgba(145,47,18,0.2)] transition-transform duration-200 hover:-translate-y-0.5"
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
          <section className="panel-card luxury-section p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
              Categorias
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase">
              Criar e ordenar categorias
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Cadastre as categorias que devem aparecer no cardapio e defina a ordem em que elas vao aparecer para o cliente.
            </p>

            <form onSubmit={handleCategorySubmit} className="panel-subtle mt-8 space-y-5 p-5 sm:p-6">
              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_180px]">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold">Nome da categoria</span>
                  <input
                    required
                    value={categoryForm.name}
                    onChange={(event) =>
                      setCategoryForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Ex.: Pasteis, Burgers, Sobremesas"
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold">Ordem</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={categoryForm.displayOrder}
                    onChange={(event) =>
                      setCategoryForm((current) => ({
                        ...current,
                        displayOrder: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                  />
                </label>
              </div>

              <label className="inline-flex items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={categoryForm.active}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      active: event.target.checked,
                    }))
                  }
                />
                Categoria ativa no cardapio
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_18px_30px_rgba(145,47,18,0.2)] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {saving
                    ? "Salvando..."
                    : categoryForm.id
                      ? "Atualizar categoria"
                      : "Criar categoria"}
                </button>
                {categoryForm.id ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCategoryForm({
                        ...emptyCategoryForm,
                        displayOrder: String((categories.length || 0) + 1),
                      })
                    }
                    className="glass-pill rounded-full px-6 py-4 text-sm font-bold uppercase tracking-[0.16em]"
                  >
                    Cancelar edicao
                  </button>
                ) : null}
              </div>
            </form>

            <div className="mt-6 space-y-4">
              {categories.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-white/60 p-5 text-sm text-[var(--muted)]">
                  Nenhuma categoria cadastrada ainda.
                </div>
              ) : (
                categories.map((category) => (
                  <article
                    key={category.id}
                    className="luxury-section rounded-[24px] border border-[var(--line)] bg-white/80 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black">{formatCategoryLabel(category.name)}</h3>
                          {!category.active ? (
                            <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                              Inativa
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          Ordem de exibicao: {category.displayOrder}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => startEditCategory(category)}
                        className="glass-pill rounded-full px-4 py-3 text-sm font-bold uppercase tracking-[0.12em]"
                      >
                        Editar
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="panel-card luxury-section p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
              Cadastro
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase">
              Criar ou editar produto
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Monte a ficha do produto como ele deve aparecer para o cliente:
              nome forte, descricao curta, preco e imagem.
            </p>
            <form onSubmit={handleProductSubmit} className="panel-subtle mt-8 space-y-5 p-5 sm:p-6">
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
                        category: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {formatCategoryLabel(category.name)}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 ? (
                    <p className="text-xs leading-6 text-[var(--muted)]">
                      Cadastre a categoria primeiro para depois vincular o produto.
                    </p>
                  ) : null}
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

              <label className="block space-y-2">
                <span className="text-sm font-semibold">Composicao do produto</span>
                <textarea
                  value={productForm.compositionText}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      compositionText: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Ex.: pao brioche, carne 160g, queijo, bacon e molho da casa"
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold">Tamanhos</span>
                  <textarea
                    value={productForm.sizeOptionsText}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        sizeOptionsText: event.target.value,
                      }))
                    }
                    rows={5}
                    placeholder={"Pequeno|0\nGrande|6"}
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                  />
                  <p className="text-xs leading-6 text-[var(--muted)]">
                    Use uma linha por tamanho: Nome|Acrescimo
                  </p>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold">Adicionais e opcionais</span>
                  <textarea
                    value={productForm.optionalItemsText}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        optionalItemsText: event.target.value,
                      }))
                    }
                    rows={5}
                    placeholder={"Queijo extra|3.5\nBacon extra|4"}
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                  />
                  <p className="text-xs leading-6 text-[var(--muted)]">
                    Use uma linha por opcional: Nome|Preco
                  </p>
                </label>
              </div>

              <div className="flex flex-wrap gap-5">
                <label className="inline-flex items-center gap-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={productForm.allowCustomerNote}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        allowCustomerNote: event.target.checked,
                      }))
                    }
                  />
                  Permitir observacao do cliente
                </label>
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
                  disabled={saving || categories.length === 0}
                  className="rounded-full bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_18px_30px_rgba(145,47,18,0.2)] transition-transform duration-200 hover:-translate-y-0.5"
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
                    className="glass-pill rounded-full px-6 py-4 text-sm font-bold uppercase tracking-[0.16em]"
                  >
                    Cancelar edicao
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="panel-card luxury-section p-6 sm:p-8">
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
                    className="luxury-section rounded-[24px] border border-[var(--line)] bg-white/80 p-4"
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
                          <span>{formatCategoryLabel(product.category)}</span>
                          <span>{formatCurrency(product.price)}</span>
                        </div>
                        {product.compositionText ? (
                          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                            {product.compositionText}
                          </p>
                        ) : null}
                        {(product.sizeOptionsText || product.optionalItemsText || product.allowCustomerNote) ? (
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-strong)]">
                            Produto personalizavel
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => startEditProduct(product)}
                        className="glass-pill rounded-full px-4 py-3 text-sm font-bold uppercase tracking-[0.12em]"
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
          <section className="panel-card luxury-section p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
              Promocoes
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase">
              Criar ou editar banner
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Use chamadas curtas, uma imagem forte e um texto de acao simples.
            </p>

            <form onSubmit={handleBannerSubmit} className="panel-subtle mt-8 space-y-5 p-5 sm:p-6">
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
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold">Selo da campanha</span>
                  <input
                    value={bannerForm.campaignBadge}
                    onChange={(event) =>
                      setBannerForm((current) => ({
                        ...current,
                        campaignBadge: event.target.value,
                      }))
                    }
                    placeholder="Ex.: Combo da semana"
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold">Ordem de exibicao</span>
                  <input
                    type="number"
                    min={0}
                    value={bannerForm.displayOrder}
                    onChange={(event) =>
                      setBannerForm((current) => ({
                        ...current,
                        displayOrder: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                  />
                </label>
              </div>
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
              <label className="block space-y-2">
                <span className="text-sm font-semibold">Acao do botao</span>
                <select
                  value={bannerForm.ctaMode}
                  onChange={(event) =>
                    setBannerForm((current) => ({
                      ...current,
                      ctaMode: event.target.value as "LINK" | "ADD_TO_CART",
                      ctaHref:
                        event.target.value === "ADD_TO_CART"
                          ? ""
                          : current.ctaHref || "#cardapio",
                    }))
                  }
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                >
                  <option value="LINK">Abrir link</option>
                  <option value="ADD_TO_CART">Adicionar produto ao carrinho</option>
                </select>
              </label>
              {bannerForm.ctaMode === "ADD_TO_CART" ? (
                <label className="block space-y-2">
                  <span className="text-sm font-semibold">Produto do banner</span>
                  <select
                    value={bannerForm.ctaProductId}
                    onChange={(event) =>
                      setBannerForm((current) => ({
                        ...current,
                        ctaProductId: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                  >
                    <option value="">Selecione um produto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="block space-y-2">
                <span className="text-sm font-semibold">Destino do botao</span>
                <input
                  value={bannerForm.ctaHref}
                  onChange={(event) =>
                    setBannerForm((current) => ({
                      ...current,
                      ctaHref: event.target.value,
                    }))
                  }
                  placeholder="#cardapio, /checkout ou https://..."
                  className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                  disabled={bannerForm.ctaMode === "ADD_TO_CART"}
                />
                <p className="text-xs leading-6 text-[var(--muted)]">
                  {bannerForm.ctaMode === "ADD_TO_CART"
                    ? "Nesse modo, o banner adiciona direto o produto selecionado ao carrinho."
                    : <>Use <strong>#cardapio</strong> para rolar ate os produtos, <strong>/checkout</strong> para abrir o checkout, ou um link completo como <strong>https://wa.me/...</strong>.</>}
                </p>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold">Iniciar campanha em</span>
                  <input
                    type="datetime-local"
                    value={bannerForm.startsAt}
                    onChange={(event) =>
                      setBannerForm((current) => ({
                        ...current,
                        startsAt: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold">Encerrar campanha em</span>
                  <input
                    type="datetime-local"
                    value={bannerForm.endsAt}
                    onChange={(event) =>
                      setBannerForm((current) => ({
                        ...current,
                        endsAt: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                  />
                </label>
              </div>
              <label className="inline-flex items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={bannerForm.highlighted}
                  onChange={(event) =>
                    setBannerForm((current) => ({
                      ...current,
                      highlighted: event.target.checked,
                    }))
                  }
                />
                Banner em destaque principal
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
                  className="rounded-full bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] px-6 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_18px_30px_rgba(145,47,18,0.2)] transition-transform duration-200 hover:-translate-y-0.5"
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
                    className="glass-pill rounded-full px-6 py-4 text-sm font-bold uppercase tracking-[0.16em]"
                  >
                    Cancelar edicao
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="panel-card luxury-section p-6 sm:p-8">
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
                    className="luxury-section rounded-[24px] border border-[var(--line)] bg-white/80 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black">{banner.title}</h3>
                          {banner.campaignBadge ? (
                            <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]">
                              {banner.campaignBadge}
                            </span>
                          ) : null}
                          {banner.highlighted ? (
                            <span className="rounded-full bg-[var(--brand)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                              Destaque principal
                            </span>
                          ) : null}
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
                        <p className="mt-1 break-all text-xs text-[var(--muted)]">
                          {banner.ctaMode === "ADD_TO_CART"
                            ? `Adiciona ao carrinho: ${products.find((product) => product.id === banner.ctaProductId)?.name ?? "Produto nao encontrado"}`
                            : banner.ctaHref || "#cardapio"}
                        </p>
                        <p className="mt-2 text-xs text-[var(--muted)]">
                          Ordem: {banner.displayOrder}
                          {banner.startsAt ? ` | Inicia: ${formatDateTimeLabel(new Date(banner.startsAt))}` : ""}
                          {banner.endsAt ? ` | Encerra: ${formatDateTimeLabel(new Date(banner.endsAt))}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startEditBanner(banner)}
                        className="glass-pill rounded-full px-4 py-3 text-sm font-bold uppercase tracking-[0.12em]"
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
          <section className="panel-card luxury-section p-6 sm:p-8">
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

            <div className="panel-subtle mt-6 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-strong)]">
                Mensagem pronta
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Copie este texto-base para entregar o projeto ao cliente com os links.
              </p>
              <textarea
                readOnly
                value={clientDeliveryMessage}
                rows={12}
                className="mt-4 w-full rounded-[22px] border border-[var(--line)] bg-white px-4 py-4 text-sm leading-6 text-[var(--foreground)]"
              />
              <button
                type="button"
                onClick={() => void copyText("client-message", clientDeliveryMessage)}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_16px_26px_rgba(145,47,18,0.2)]"
              >
                {copiedKey === "client-message" ? <Check size={16} /> : <Copy size={16} />}
                {copiedKey === "client-message" ? "Copiado" : "Copiar mensagem"}
              </button>
            </div>
          </section>

          <section className="panel-card luxury-section p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
              Links
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase">
              Acessos operacionais
            </h2>

            <div className="mt-8 grid gap-4">
              {operationLinks.map((item) => (
                <div
                  key={item.key}
                  className="rounded-[22px] border border-[var(--line)] bg-white/80 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {item.note}
                      </p>
                      <p className="mt-3 break-all text-sm font-semibold text-[var(--brand)]">
                        {item.href}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void copyText(item.key, item.href)}
                        className="glass-pill inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold uppercase tracking-[0.12em]"
                      >
                        {copiedKey === item.key ? <Check size={16} /> : <Copy size={16} />}
                        {copiedKey === item.key ? "Copiado" : "Copiar"}
                      </button>
                      <Link
                        href={item.href}
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] px-4 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white"
                      >
                        Abrir
                        <ExternalLink size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel-card luxury-section p-6 sm:p-8 xl:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
                  Historico
                </p>
                <h2 className="mt-2 text-3xl font-black uppercase">
                  Historico completo de pedidos
                </h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void archiveAllOrderHistory()}
                  disabled={resettingOrders || orders.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(179,63,47,0.2)] bg-[rgba(179,63,47,0.08)] px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  {resettingOrders ? "Arquivando..." : "Arquivar historico"}
                </button>
                <Link
                  href="/cozinha"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.14em]"
                >
                  Abrir painel da cozinha
                </Link>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <label className="relative block w-full max-w-md">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                />
                <input
                  value={orderSearch}
                  onChange={(event) => setOrderSearch(event.target.value)}
                  placeholder="Buscar por cliente ou numero do pedido"
                  className="w-full rounded-full border border-[var(--line)] bg-white py-3 pl-11 pr-4 text-sm"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {(["TODOS", "NOVO", "EM_PREPARO", "PRONTO", "ENTREGUE"] as const).map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setHistoryStatusFilter(status)}
                      className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${
                        historyStatusFilter === status
                          ? "bg-[var(--brand)] text-white"
                          : "glass-pill text-[var(--foreground)]"
                      }`}
                    >
                      {status === "TODOS"
                        ? "Todos"
                        : status === "EM_PREPARO"
                          ? "Em preparo"
                          : orderStatusLabels[status]}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {filteredOrderHistory.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-white/60 p-5 text-sm text-[var(--muted)]">
                  Nenhum pedido encontrado com esse filtro.
                </div>
              ) : (
                filteredOrderHistory.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-[22px] border border-[var(--line)] bg-white/80 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">
                            Pedido {order.orderNumberFormatted}
                          </p>
                          <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em]">
                            {orderStatusLabels[order.status]}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                            {order.paymentStatus}
                          </span>
                        </div>
                        <h3 className="mt-3 text-lg font-black">{order.customerName}</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {order.displayTime}
                        </p>
                      </div>

                      <div className="rounded-[18px] bg-[var(--surface)] px-4 py-3 text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                          Total
                        </p>
                        <strong className="mt-1 block text-lg text-[var(--brand)]">
                          {formatCurrency(order.total)}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
                      <div className="space-y-2 text-sm text-[var(--muted)]">
                        {order.items.map((item) => (
                          <p key={item.id}>
                            {item.quantity}x {item.productName}
                          </p>
                        ))}
                      </div>
                      <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                        <p>
                          <strong className="text-[var(--foreground)]">Itens:</strong>{" "}
                          {order.items.length}
                        </p>
                        <p>
                          <strong className="text-[var(--foreground)]">Status:</strong>{" "}
                          {orderStatusLabels[order.status]}
                        </p>
                        <p>
                          <strong className="text-[var(--foreground)]">Pagamento:</strong>{" "}
                          {order.paymentStatus}
                        </p>
                      </div>
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
