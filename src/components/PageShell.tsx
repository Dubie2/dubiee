import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div dir="rtl" className="relative min-h-screen overflow-x-hidden">
      {/* Removed fairy-bg for pure white background */}
      <SiteHeader />

      <motion.div
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        style={{ originY: 0 }}
        className="pointer-events-none fixed inset-0 z-50 bg-gradient-to-b from-accent to-background"
      />

      <main className="mx-auto max-w-6xl px-5 pt-32 pb-16 md:pt-40">
        <motion.header
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          className="mb-10 text-center"
        >
          {eyebrow && (
            <p className="text-xs tracking-[0.4em] text-primary uppercase">{eyebrow}</p>
          )}
          <h1 className="font-display mt-3 text-3xl font-extrabold sm:text-5xl">{title}</h1>
          {subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          )}
        </motion.header>

        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
