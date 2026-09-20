import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, Filter, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useStore } from "@/lib/store";

type ProductSearch = {
  category?: string | undefined;
  style?: string | undefined;
  color?: string | undefined;
  size?: string | undefined;
  fabric?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  sort?: string | undefined;
  inStock?: boolean | undefined;
};

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    category: typeof search["category"] === "string" ? search["category"] : undefined,
    style: typeof search["style"] === "string" ? search["style"] : undefined,
    color: typeof search["color"] === "string" ? search["color"] : undefined,
    size: typeof search["size"] === "string" ? search["size"] : undefined,
    fabric: typeof search["fabric"] === "string" ? search["fabric"] : undefined,
    minPrice: typeof search["minPrice"] === "number" ? search["minPrice"] : (typeof search["minPrice"] === "string" ? parseInt(search["minPrice"], 10) : undefined),
    maxPrice: typeof search["maxPrice"] === "number" ? search["maxPrice"] : (typeof search["maxPrice"] === "string" ? parseInt(search["maxPrice"], 10) : undefined),
    sort: typeof search["sort"] === "string" ? search["sort"] : undefined,
    inStock: search["inStock"] === true || search["inStock"] === 'true' ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "المنتجات · Dubai Abaya" },
      {
        name: "description",
        content: "تسوّقي عبايات وجلابيات Dubai Abaya مع البحث والتصفية حسب الفئة والنمط والسعر.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { state } = useStore();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/products/" });
  
  const [q, setQ] = useState("");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Extract all available options from actual products
  const availableCategories = state.categories;
  const availableStyles = Array.from(new Set(state.products.flatMap(p => p.styles || [])));
  const availableColors = Array.from(new Set(state.products.flatMap(p => p.colors || (p.color ? [p.color] : []))));
  const availableSizes = Array.from(new Set(state.products.flatMap(p => p.sizes || [])));
  const availableFabrics = Array.from(new Set(state.products.map(p => p.fabric).filter(Boolean) as string[]));

  // Filter Logic
  const filteredProducts = useMemo(() => {
    let list = state.products.filter(p => {
      // Text Search
      if (q.trim()) {
        const query = q.toLowerCase();
        if (!p.name.toLowerCase().includes(query) && !p.tag?.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      if (search.category && p.categoryId !== search.category) return false;
      if (search.style && !p.styles?.includes(search.style)) return false;
      if (search.fabric && p.fabric !== search.fabric) return false;
      
      if (search.color) {
        const pColors = p.colors || (p.color ? [p.color] : []);
        if (!pColors.includes(search.color)) return false;
      }
      
      if (search.size && !p.sizes?.includes(search.size)) return false;
      
      if (search.minPrice !== undefined && p.price < search.minPrice) return false;
      if (search.maxPrice !== undefined && p.price > search.maxPrice) return false;
      
      if (search.inStock && p.is_available === false) return false;

      return true;
    });

    // Sorting Logic
    if (search.sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (search.sort === "price-desc") list.sort((a, b) => b.price - a.price);
    // Add logic for "newest" if we add a date to product model, for now reverse the array
    else if (search.sort === "newest") list.reverse();

    return list;
  }, [state.products, search, q]);

  const updateFilter = (key: keyof ProductSearch, value: any) => {
    navigate({
      search: (prev) => ({ ...prev, [key]: value === prev[key] ? undefined : value }),
    });
  };
  
  const clearFilters = () => {
    navigate({ search: {} });
    setQ("");
  };

  const FiltersSidebar = () => (
    <div className="flex flex-col gap-8">
      {/* Search */}
      <div>
        <h3 className="font-bold mb-3 text-sm">البحث</h3>
        <div className="flex items-center gap-2 rounded-xl bg-background border border-border px-3 py-2.5 shadow-sm">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="الاسم، كلمة مفتاحية..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-bold mb-3 text-sm">التصنيف</h3>
        <div className="flex flex-wrap gap-2">
          {availableCategories.map(c => (
            <button
              key={c.id}
              onClick={() => updateFilter('category', c.id)}
              className={`tap-pulse rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                search.category === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:border-foreground/30 border-border"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!search.inStock}
            onChange={(e) => updateFilter('inStock', e.target.checked || undefined)}
            className="size-4 accent-primary rounded"
          />
          <span className="text-sm font-bold">متوفر في المخزون فقط</span>
        </label>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-bold mb-3 text-sm">نطاق السعر (د.إ)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="من"
            value={search.minPrice || ""}
            onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full rounded-xl bg-background border border-border px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="number"
            placeholder="إلى"
            value={search.maxPrice || ""}
            onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full rounded-xl bg-background border border-border px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <h3 className="font-bold mb-3 text-sm">الترتيب</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "newest", label: "الأحدث" },
            { id: "price-asc", label: "الأقل سعراً" },
            { id: "price-desc", label: "الأعلى سعراً" }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => updateFilter('sort', opt.id)}
              className={`tap-pulse rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                search.sort === opt.id ? "bg-secondary text-secondary-foreground border-secondary-foreground" : "bg-background hover:border-foreground/30 border-border"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      {availableColors.length > 0 && (
        <div>
          <h3 className="font-bold mb-3 text-sm">اللون</h3>
          <div className="flex flex-wrap gap-2">
            {availableColors.map(c => (
              <button
                key={c}
                onClick={() => updateFilter('color', c)}
                className={`tap-pulse rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                  search.color === c ? "bg-foreground text-background border-foreground" : "bg-background hover:border-foreground/30 border-border"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sizes */}
      {availableSizes.length > 0 && (
        <div>
          <h3 className="font-bold mb-3 text-sm">المقاس</h3>
          <div className="flex flex-wrap gap-2">
            {availableSizes.sort().map(s => (
              <button
                key={s}
                onClick={() => updateFilter('size', s)}
                className={`tap-pulse min-w-[3rem] rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                  search.size === s ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:border-foreground/30 border-border"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fabrics */}
      {availableFabrics.length > 0 && (
        <div>
          <h3 className="font-bold mb-3 text-sm">القماش</h3>
          <div className="flex flex-wrap gap-2">
            {availableFabrics.map(f => (
              <button
                key={f}
                onClick={() => updateFilter('fabric', f)}
                className={`tap-pulse rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                  search.fabric === f ? "bg-secondary text-secondary-foreground border-secondary-foreground" : "bg-background hover:border-foreground/30 border-border"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={clearFilters}
        className="tap-pulse text-xs text-muted-foreground underline text-center w-full mt-4"
      >
        مسح جميع الفلاتر
      </button>
    </div>
  );

  return (
    <div dir="rtl" className="relative min-h-screen bg-background flex flex-col">
      <SiteHeader />
      
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-24 sm:pt-32 pb-24">
        
        <div className="flex items-end justify-between mb-8 border-b border-border/50 pb-6">
          <div>
            <h1 className="font-display text-4xl font-extrabold text-foreground">المنتجات</h1>
            <p className="mt-2 text-muted-foreground text-sm">
              استكشفي تشكيلتنا المميزة ({filteredProducts.length} منتج)
            </p>
          </div>
          
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="lg:hidden tap-pulse flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-bold shadow-sm"
          >
            <SlidersHorizontal className="size-4" /> فلاتر
          </button>
        </div>

        <div className="flex gap-10">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-[280px] shrink-0">
            <div className="sticky top-32 glass-strong rounded-3xl p-6 border border-border/50 shadow-sm">
              <FiltersSidebar />
            </div>
          </aside>

          {/* Main Grid */}
          <div className="flex-1 min-w-0">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-4xl border border-dashed border-border py-24 text-center">
                <Search className="size-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-bold text-lg">لم نجد أي نتائج مطابقة لبحثك</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-md">
                  جربي تغيير خيارات الفلترة أو مسح البحث لعرض جميع المنتجات المتوفرة.
                </p>
                <button
                  onClick={clearFilters}
                  className="tap-pulse mt-6 rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground"
                >
                  عرض جميع المنتجات
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 sm:gap-6">
                {filteredProducts.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filters Drawer */}
        <AnimatePresence>
          {isMobileFiltersOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileFiltersOpen(false)}
                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 z-50 flex h-[85vh] flex-col rounded-t-4xl border-t border-border bg-background shadow-2xl lg:hidden"
              >
                <div className="flex items-center justify-between border-b border-border/50 px-6 py-5">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <Filter className="size-5" /> الفلاتر
                  </h2>
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="tap-pulse grid size-8 place-items-center rounded-full bg-secondary text-secondary-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
                  <FiltersSidebar />
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 border-t border-border/50 bg-background/80 p-4 backdrop-blur-md">
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="tap-pulse flex w-full items-center justify-center rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-soft"
                  >
                    عرض النتائج ({filteredProducts.length})
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
      
      <SiteFooter />
    </div>
  );
}
