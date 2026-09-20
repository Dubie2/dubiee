import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Gem, HandHeart, Sparkles, Truck } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن · Dubai Abaya" },
      {
        name: "description",
        content: "قصة أتيليه Dubai Abaya: حرفية يدوية، أقمشة نادرة، وروح دبي في كل قطعة.",
      },
      { property: "og:title", content: "من نحن · Dubai Abaya" },
      { property: "og:description", content: "حكاية أتيليه العبايات الفاخرة في دبي." },
    ],
  }),
  component: AboutPage,
});

const values = [
  { icon: Gem, t: "أقمشة نادرة", d: "حرير وشيفون مختار من أرقى دور النسيج." },
  { icon: HandHeart, t: "تفصيل يدوي", d: "كل غرزة تُنفَّذ يدوياً في أتيليه دبي." },
  { icon: Truck, t: "توصيل مخملي", d: "تغليف فاخر وتسليم خلال ٤٨ ساعة." },
  { icon: Sparkles, t: "إصدارات محدودة", d: "كل قصّة تُنتج بعدد محدود للحفاظ على تميزها." },
];

function AboutPage() {
  const { state } = useStore();

  return (
    <PageShell
      eyebrow="Our Story"
      title="من نحن"
      subtitle={state.info.about || "قصة أتيليه Dubai Abaya: حرفية يدوية، أقمشة نادرة، وروح دبي في كل قطعة."}
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {values.map((v, i) => (
          <motion.div
            key={v.t}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="glass rounded-4xl p-7"
          >
            <v.icon className="size-5 text-primary" />
            <h2 className="font-display mt-4 text-lg font-bold">{v.t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.d}</p>
          </motion.div>
        ))}
      </div>

      <section className="glass-strong mt-10 rounded-4xl p-8 text-center sm:p-12">
        <blockquote className="font-display text-2xl leading-[1.6] font-bold sm:text-3xl">
          «الأناقة ليست ما ترتدينه، بل الأثر الذي تتركينه حين تمرّين.»
        </blockquote>
        <p className="mt-6 text-sm tracking-[0.3em] text-muted-foreground uppercase">
          Dubai Abaya Atelier
        </p>
      </section>
    </PageShell>
  );
}
