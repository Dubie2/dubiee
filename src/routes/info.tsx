import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Building2,
  Clock,
  Copy,
  CreditCard,
  Headphones,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useState } from "react";

import { PageShell } from "@/components/PageShell";
import { useStore, whatsappLink } from "@/lib/store";

export const Route = createFileRoute("/info")({
  head: () => ({
    meta: [
      { title: "التواصل والمعلومات والحسابات · Dubai Abaya" },
      {
        name: "description",
        content: "واتساب، إنستغرام، البريد، ساعات العمل، الحسابات البنكية والمحافظ الإلكترونية في Dubai Abaya.",
      },
      { property: "og:title", content: "التواصل والحسابات · Dubai Abaya" },
      { property: "og:description", content: "قنوات التواصل وبيانات التحويل البنكي والمحافظ الإلكترونية." },
    ],
  }),
  component: InfoPage,
});

function InfoPage() {
  const { state } = useStore();
  const [copied, setCopied] = useState<string | null>(null);
  const { info } = state;

  const copy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const hasWallets = Array.isArray(info.wallets) && info.wallets.length > 0;
  const hasBanks = Array.isArray(info.banks) && info.banks.length > 0;

  return (
    <PageShell
      eyebrow="Contact & Info"
      title="التواصل والمعلومات"
      subtitle="نحن متواجدون دائماً لخدمتك ومساعدتك في اختيار القطعة المثالية."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact Channels */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-strong flex flex-col gap-4 rounded-4xl p-7"
        >
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/50">
            <Headphones className="size-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">قنوات التواصل المباشر</h2>
          </div>

          <div className="flex flex-col gap-3">
            {info.whatsapp ? (
              <a
                href={whatsappLink(info.whatsapp, "مرحباً Dubai Abaya، لدي استفسار بخصوص المتجر والمنتجات")}
                target="_blank"
                rel="noreferrer"
                className="tap-pulse flex items-center justify-between gap-3 rounded-3xl bg-background/80 px-5 py-4 text-sm font-semibold transition hover:border-primary/40 hover:bg-background"
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-2xl bg-[#25D366]/15 text-[#25D366]">
                    <MessageCircle className="size-5" />
                  </span>
                  واتساب المباشر
                </span>
                <span className="text-xs text-muted-foreground font-mono" dir="ltr">
                  {info.whatsapp}
                </span>
              </a>
            ) : null}

            {info.instagram ? (
              <a
                href={`https://instagram.com/${info.instagram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className="tap-pulse flex items-center justify-between gap-3 rounded-3xl bg-background/80 px-5 py-4 text-sm font-semibold transition hover:border-primary/40 hover:bg-background"
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-2xl bg-pink-500/15 text-pink-500">
                    <Instagram className="size-5" />
                  </span>
                  إنستغرام
                </span>
                <span className="text-xs text-muted-foreground font-mono" dir="ltr">
                  @{info.instagram.replace("@", "")}
                </span>
              </a>
            ) : null}

            {info.email ? (
              <a
                href={`mailto:${info.email}`}
                className="tap-pulse flex items-center justify-between gap-3 rounded-3xl bg-background/80 px-5 py-4 text-sm font-semibold transition hover:border-primary/40 hover:bg-background"
              >
                <span className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-2xl bg-primary/15 text-primary">
                    <Mail className="size-5" />
                  </span>
                  البريد الإلكتروني
                </span>
                <span className="text-xs text-muted-foreground font-mono" dir="ltr">
                  {info.email}
                </span>
              </a>
            ) : null}

            {info.address ? (
              <div className="flex items-center gap-3 rounded-3xl bg-background/80 px-5 py-4 text-sm">
                <span className="grid size-9 place-items-center rounded-2xl bg-primary/15 text-primary shrink-0">
                  <MapPin className="size-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">العنوان والمقر</p>
                  <p className="font-semibold text-foreground mt-0.5">{info.address}</p>
                </div>
              </div>
            ) : null}

            {info.hours ? (
              <div className="flex items-center gap-3 rounded-3xl bg-background/80 px-5 py-4 text-sm">
                <span className="grid size-9 place-items-center rounded-2xl bg-primary/15 text-primary shrink-0">
                  <Clock className="size-5" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">ساعات العمل وخدمة العملاء</p>
                  <p className="font-semibold text-foreground mt-0.5">{info.hours}</p>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>

        {/* Payment Accounts (Wallets & Banks) */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col gap-6"
        >
          {/* Electronic Wallets */}
          {hasWallets && (
            <div className="glass-strong flex flex-col gap-4 rounded-4xl p-7">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <Wallet className="size-5 text-primary" />
                  <h2 className="font-display text-lg font-bold text-foreground">المحافظ الإلكترونية</h2>
                </div>
                <span className="text-xs text-muted-foreground">تحويل فوري</span>
              </div>

              <div className="grid gap-3">
                {info.wallets.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between gap-3 rounded-3xl bg-background/80 p-4 border border-border/50"
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground">{w.name}</p>
                      <p className="text-xs text-primary font-mono font-bold mt-1" dir="ltr">
                        {w.number}
                      </p>
                    </div>
                    <button
                      onClick={() => copy(w.number, w.id)}
                      className="tap-pulse flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-2 text-xs font-semibold text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition"
                    >
                      <Copy className="size-3.5" /> {copied === w.id ? "تم النسخ ✓" : "نسخ الرقم"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bank Accounts */}
          <div className="glass-strong flex flex-col gap-4 rounded-4xl p-7">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <Building2 className="size-5 text-primary" />
                <h2 className="font-display text-lg font-bold text-foreground">الحسابات البنكية</h2>
              </div>
              <span className="text-xs text-muted-foreground">إيداع / IBAN</span>
            </div>

            {hasBanks ? (
              <div className="grid gap-3.5">
                {info.banks.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-3xl bg-background/80 p-5 border border-border/50 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {b.logo ? (
                          <img src={b.logo} alt={b.bank} className="size-8 rounded-xl object-contain" />
                        ) : (
                          <CreditCard className="size-5 text-primary" />
                        )}
                        <p className="text-sm font-bold text-foreground">{b.bank}</p>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{b.holder}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3 pt-2 border-t border-border/40">
                      <span className="text-xs font-mono font-bold text-foreground tracking-wider" dir="ltr">
                        {b.iban}
                      </span>
                      <button
                        onClick={() => copy(b.iban, b.id)}
                        className="tap-pulse flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition"
                      >
                        <Copy className="size-3.5" /> {copied === b.id ? "تم النسخ ✓" : "نسخ"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2">
                يتم تأكيد تفاصيل التحويل البنكي مباشرة عند التواصل وتأكيد الطلب.
              </p>
            )}

            <div className="flex items-center gap-2 rounded-2xl bg-primary/10 p-3 text-xs text-primary font-medium">
              <Sparkles className="size-4 shrink-0" />
              <span>بعد إتمام التحويل، يرجى إرسال صورة الإشعار عبر واتساب لتأكيد طلبك وتجهيزه فوراً.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </PageShell>
  );
}
