"use client";

import { useMemo, useState } from "react";
import { CartPanel } from "@/components/carrinho/cart-panel";
import { SectionTitle } from "@/components/ui/section-title";
import { categoryLabels } from "@/lib/constants";
import type { Product, ProductCategory } from "@/lib/types";
import { useCartStore } from "@/store/cart-store";
import { ProductCard } from "./product-card";

const categories = Object.keys(categoryLabels) as ProductCategory[];

export function MenuClient({ products }: { products: Product[] }) {
  const addItem = useCartStore((state) => state.addItem);
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "TODOS">(
    "TODOS",
  );

  const filteredProducts = useMemo(() => {
    if (activeCategory === "TODOS") {
      return products;
    }

    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

  return (
    <div className="container-shell py-8 sm:py-12">
      <SectionTitle
        eyebrow="Cardapio"
        title="Monte o pedido do jeito que sua hamburgueria vende melhor"
        description="Categorias organizadas, cards de produtos com imagem e um carrinho sempre visivel para acelerar o fechamento do pedido."
      />

      <div className="-mx-4 mt-8 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="glass-pill flex min-w-max gap-3 rounded-[28px] px-3 py-3">
        <button
          type="button"
          onClick={() => setActiveCategory("TODOS")}
          className={`rounded-full px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] transition-colors ${
            activeCategory === "TODOS"
              ? "bg-[var(--brand)] text-white"
              : "bg-white/78 text-[var(--foreground)]"
          }`}
        >
          Todos
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] transition-colors ${
              activeCategory === category
                ? "bg-[var(--brand)] text-white"
                : "bg-white/78 text-[var(--foreground)]"
            }`}
          >
            {categoryLabels[category]}
          </button>
        ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addItem} />
          ))}
        </div>
        <CartPanel />
      </div>
    </div>
  );
}
