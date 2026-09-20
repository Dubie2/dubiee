import { Link } from "@tanstack/react-router";
import { Instagram, MessageCircle, Settings, ShieldCheck, Truck, RefreshCcw, HeadphonesIcon } from "lucide-react";

import { useStore, whatsappLink } from "@/lib/store";

export function SiteFooter() {
  const { state } = useStore();

  return (
    <footer className="mt-20 border-t border-border/50 bg-background/50">
      {/* Trust Section */}
      <div className="mx-auto max-w-7xl px-5 py-12 border-b border-border/50">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-6" />
            </div>
            <h4 className="font-bold text-foreground text-sm">جودة مضمونة</h4>
            <p className="text-xs text-muted-foreground">أجود أنواع الأقمشة المختارة بعناية</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Truck className="size-6" />
            </div>
            <h4 className="font-bold text-foreground text-sm">توصيل سريع</h4>
            <p className="text-xs text-muted-foreground">توصيل آمن وسريع لجميع المدن</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <RefreshCcw className="size-6" />
            </div>
            <h4 className="font-bold text-foreground text-sm">سياسة استبدال مرنة</h4>
            <p className="text-xs text-muted-foreground">استبدال سهل خلال 3 أيام</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <HeadphonesIcon className="size-6" />
            </div>
            <h4 className="font-bold text-foreground text-sm">خدمة عملاء</h4>
            <p className="text-xs text-muted-foreground">متواجدون دائماً لخدمتك عبر واتساب</p>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-5 py-16">
        <div className="grid gap-12 lg:grid-cols-4">
          
          <div className="flex flex-col items-start gap-6 lg:col-span-1">
            {state.branding.logo || state.branding.mark ? (
              <img
                src={state.branding.logo || state.branding.mark}
                alt={state.info.storeName || "شعار المتجر"}
                loading="lazy"
                className="h-16 w-auto object-contain"
              />
            ) : (
              <span className="font-display text-2xl font-black text-foreground tracking-tight">
                {state.info.storeName || "Dubai Abaya"}
              </span>
            )}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {state.info.about || "وجهتك الأولى لأرقى العبايات والجلابيات. نصمم بشغف لنقدم لكِ قطعاً تتفرد بالفخامة والجودة الاستثنائية."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:col-span-3 sm:grid-cols-3">
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-foreground">تسوقي الآن</h4>
              <Link to="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">جميع المنتجات</Link>
              {state.categories.slice(0, 4).map(c => (
                <Link key={c.id} to="/products" search={{ category: c.id }} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {c.name}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-foreground">روابط هامة</h4>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">من نحن</Link>
              <Link to="/info" className="text-sm text-muted-foreground hover:text-primary transition-colors">الشحن والتوصيل</Link>
              <Link to="/info" className="text-sm text-muted-foreground hover:text-primary transition-colors">سياسة الاستبدال والاسترجاع</Link>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-foreground">تواصل معنا</h4>
              <a
                href={whatsappLink(state.info.whatsapp, "مرحباً، لدي استفسار")}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="size-4" /> واتساب
              </a>
              <a
                href={`https://instagram.com/${state.info.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="size-4" /> إنستغرام
              </a>
              {/* NOTE: admin link should not be visible to normal customers as per user instructions, but since it's an admin dashboard currently accessed via route, we can hide it in footer or keep it very subtle */}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-5 sm:flex-row">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {state.info.storeName}. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
