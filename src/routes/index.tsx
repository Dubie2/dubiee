import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { HeroJewel } from "@/components/HeroJewel";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useStore } from "@/lib/store";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dubai Abaya · معرض العبايات والجلابيات الفاخرة" },
      {
        name: "description",
        content:
          "متجر Dubai Abaya الرقمي: عبايات وجلابيات فاخرة بتصاميم دبي، تجربة تسوق بصرية ثلاثية الأبعاد بلمسة لافندر أنيقة.",
      },
      { property: "og:title", content: "Dubai Abaya · معرض العبايات الفاخرة" },
      {
        property: "og:description",
        content: "عبايات وجلابيات فاخرة بتصاميم دبي في معرض رقمي ثلاثي الأبعاد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ease = [0.22, 1, 0.36, 1] as const;

function Index() {
  const { state } = useStore();
  const featured = state.products.slice(0, 4);

  return (
    <div dir="rtl" className="relative min-h-screen overflow-x-hidden">

      <motion.div
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 1, ease, delay: 0.15 }}
        style={{ originY: 0 }}
        className="pointer-events-none fixed inset-0 z-50 bg-gradient-to-b from-accent to-background"
      />

      <SiteHeader />

      <main id="top">
        <section className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-4 px-5 pt-24 pb-12 md:flex-row md:justify-between md:pt-32 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.5 }}
            className="max-w-xl text-center md:text-right"
          >
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[0.7rem] tracking-[0.2em] text-accent-foreground">
              مجموعة ٢٠٢٦ الجديدة
            </span>
            <h1 className="font-display mt-3 text-4xl leading-[1.15] font-black sm:text-6xl">
              فخامة تتنفس
              <span className="text-gradient block">حرير دبي</span>
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
              معرض رقمي فني للعبايات والجلابيات. قصّات نقية، ألوان لافندر هادئة، وتفاصيل
              مصنوعة يدوياً لتمنحك حضوراً لا يُنسى.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
              <Link
                to="/products"
                className="tap-pulse rounded-full bg-primary px-4 py-1.5 text-[11px] font-bold text-primary-foreground shadow-soft"
              >
                اكتشفي المجموعة
              </Link>
              <Link
                to="/offers"
                className="tap-pulse glass rounded-full px-4 py-1.5 text-[11px] font-bold text-accent-foreground"
              >
                العروض الحالية
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease, delay: 0.35 }}
            className="w-full max-w-[420px]"
          >
            <HeroJewel />
          </motion.div>
        </section>

        {/* Categories strip */}
        <section className="mx-auto max-w-6xl px-5 py-6">
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            {state.categories.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, ease, delay: i * 0.07 }}
              >
                <Link
                  to="/products"
                  search={{ category: c.id }}
                  className="tap-pulse glass flex items-center gap-4 overflow-hidden rounded-2xl p-3 sm:block sm:rounded-3xl sm:p-0"
                >
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-xl object-cover sm:h-40 sm:w-full sm:rounded-none"
                  />
                  <p className="font-display text-base font-bold sm:px-4 sm:py-3 sm:text-sm">{c.name}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Collection */}
        <section id="collection" className="mx-auto max-w-6xl px-5 py-10">
          <motion.header
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="mb-6 text-center"
          >
            <p className="text-xs tracking-[0.4em] text-primary uppercase">Collection</p>
            <h2 className="font-display mt-3 text-3xl font-extrabold sm:text-4xl">
              قطع مختارة بعناية
            </h2>
          </motion.header>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>

        {/* Craft */}
        <section id="craft" className="mx-auto max-w-6xl px-5 py-10">
          <div className="glass-strong grid gap-8 rounded-4xl p-8 sm:p-12 md:grid-cols-3">
            {[
              { t: "أقمشة نادرة", d: "حرير وشيفون مختار من أرقى دور النسيج." },
              { t: "تفصيل يدوي", d: "كل غرزة تُنفَّذ يدوياً في أتيليه دبي." },
              { t: "توصيل مخملي", d: "تغليف فاخر وتسليم خلال ٤٨ ساعة." },
            ].map((c, i) => (
              <motion.div
                key={c.t}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease, delay: i * 0.1 }}
                className="tap-pulse rounded-3xl bg-background/60 p-6 shadow-neu"
              >
                <Sparkles className="size-5 text-primary" />
                <h3 className="font-display mt-4 text-lg font-bold">{c.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        {(() => {
          const allReviews = state.products.flatMap(p => p.reviews || []).slice(0, 6);
          if (allReviews.length === 0) return null;
          return (
            <section className="mx-auto max-w-6xl px-5 py-10">
              <motion.header
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease }}
                className="mb-6 text-center"
              >
                <p className="text-xs tracking-[0.4em] text-primary uppercase">Testimonials</p>
                <h2 className="font-display mt-3 text-3xl font-extrabold sm:text-4xl">
                  آراء عملائنا
                </h2>
              </motion.header>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {allReviews.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease, delay: i * 0.1 }}
                    className="glass rounded-3xl p-6"
                  >
                    <div className="flex items-center gap-1 text-amber-400 mb-4">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <svg key={idx} className={`size-4 ${idx < r.rating ? "fill-current" : "text-border fill-transparent"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm font-medium leading-relaxed mb-6">"{r.text}"</p>
                    <p className="text-xs font-bold text-muted-foreground">{r.name}</p>
                  </motion.div>
                ))}
              </div>
            </section>
          );
        })()}

        {/* Story */}
        <section id="story" className="mx-auto max-w-3xl px-5 py-10 text-center">
          <motion.blockquote
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease }}
            className="font-display text-2xl leading-[1.6] font-bold sm:text-3xl"
          >
            «الأناقة ليست ما ترتدينه، بل الأثر الذي تتركينه حين تمرّين.»
          </motion.blockquote>
          <p className="mt-6 text-sm tracking-[0.3em] text-muted-foreground uppercase">
            Dubai Abaya Atelier
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
