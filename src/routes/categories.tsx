import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Layers, Sparkles, Tag } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "فئات وتشكيلات العبايات · Dubai Abaya" },
      {
        name: "description",
        content: "استكشفي تشكيلات وفئات عبايات وجلابيات Dubai Abaya الفاخرة، المصممة بحرفية عالية ولمسات دبي الراقية.",
      },
      { property: "og:title", content: "فئات العبايات · Dubai Abaya" },
      { property: "og:description", content: "تشكيلات وتصاميم عبايات مختارة بعناية لتناسب كل المناسبات." },
    ],
  }),
  component: CategoriesPage,
});

const ease = [0.22, 1, 0.36, 1] as const;

function CategoriesPage() {
  const { state } = useStore();
  const { categories, products } = state;

  return (
    <PageShell
      eyebrow="Collections"
      title="فئات المجموعات"
      subtitle="استكشفي تشكيلاتنا المتنوعة من أرقى العبايات والجلابيات المصممة بكل شغف وإتقان."
    >
      {categories.length === 0 ? (
        <div className="glass-strong rounded-4xl p-12 text-center">
          <Layers className="mx-auto size-12 text-primary/70 mb-4 animate-bounce" />
          <h3 className="font-display text-xl font-bold text-foreground">جاري تحديث الفئات</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            تتم إضافة مجموعات وتصاميم جديدة باستمرار، تصفحي كافة المنتجات المتوفرة الآن.
          </p>
          <Link
            to="/products"
            className="tap-pulse mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-soft"
          >
            تصفح جميع المنتجات <ArrowLeft className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => {
            const productCount = products.filter((p) => p.categoryId === c.id).length;

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease, delay: i * 0.08 }}
                className="group relative"
              >
                <Link
                  to="/products"
                  search={{ category: c.id }}
                  className="tap-pulse glass block overflow-hidden rounded-4xl p-3.5 transition-all duration-500 hover:shadow-2xl hover:border-primary/40"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-secondary/30">
                    {c.image ? (
                      <img
                        src={c.image}
                        alt={c.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/20">
                        <Tag className="size-16 text-primary/40" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity duration-300 group-hover:opacity-90" />

                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-foreground shadow-sm">
                      <Sparkles className="size-3 text-primary" />
                      <span>{productCount > 0 ? `${productCount} منتجات` : "تشكيلة حصرية"}</span>
                    </div>

                    <div className="absolute bottom-4 inset-x-4 text-right">
                      <h3 className="font-display text-2xl font-black text-white drop-shadow-md">
                        {c.name}
                      </h3>
                      {c.description && (
                        <p className="mt-1 line-clamp-1 text-xs text-white/80 font-medium">
                          {c.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-foreground bg-primary/90 rounded-full px-3.5 py-1.5 transition-colors group-hover:bg-primary">
                          استكشاف الفئة <ArrowLeft className="size-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
