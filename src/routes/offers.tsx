import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Percent, Tag } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { formatAED, useStore } from "@/lib/store";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "العروض · Dubai Abaya" },
      {
        name: "description",
        content: "عروض وخصومات Dubai Abaya على العبايات والجلابيات مع أكواد خصم لفترة محدودة.",
      },
      { property: "og:title", content: "عروض Dubai Abaya" },
      { property: "og:description", content: "خصومات موسمية وأكواد حصرية على المجموعة." },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const { state } = useStore();

  return (
    <PageShell
      eyebrow="Offers"
      title="العروض"
      subtitle="خصومات لفترة محدودة على قطع مختارة من المجموعة."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {state.offers.map((o, i) => {
          const product = state.products.find((p) => p.id === o.productId);
          return (
            <motion.article
              key={o.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong flex flex-col rounded-4xl p-6"
            >
              <div className="flex items-center justify-between">
                <Percent className="size-5 text-primary" />
                {o.discount > 0 && (
                  <span className="font-display text-2xl font-black text-gradient">
                    {o.discount}%
                  </span>
                )}
              </div>
              <h2 className="font-display mt-4 text-lg font-bold">{o.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{o.subtitle}</p>

              <div className="mt-5 flex items-center gap-2 rounded-2xl bg-background/70 px-4 py-3">
                <Tag className="size-4 text-primary" />
                <span className="font-display text-sm font-bold tracking-widest">{o.code}</span>
              </div>

              {product && (
                <Link
                  to="/products/$id"
                  params={{ id: product.id }}
                  className="tap-pulse mt-5 flex items-center gap-3 rounded-3xl bg-secondary p-3"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="size-14 rounded-2xl object-cover"
                  />
                  <div>
                    <p className="text-sm font-bold">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{formatAED(product.price)}</p>
                  </div>
                </Link>
              )}
            </motion.article>
          );
        })}
      </div>
    </PageShell>
  );
}
