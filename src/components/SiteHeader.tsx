import { Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useRef, useState } from "react";

import { useStore } from "@/lib/store";

const links = [
  { label: "الرئيسية", to: "/" },
  { label: "الفئات", to: "/categories" },
  { label: "المنتجات", to: "/products" },
  { label: "العروض", to: "/offers" },
  { label: "من نحن", to: "/about" },
  { label: "التواصل", to: "/info" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { state, cartCount, setIsCartOpen, setIsAdminAuthenticated } = useStore();
  const navigate = useNavigate();
  const topOffer = state.offers[0];

  // Admin secret 3-click trigger
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = (e: React.MouseEvent) => {
    clickCountRef.current += 1;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current >= 3) {
      e.preventDefault();
      e.stopPropagation();
      clickCountRef.current = 0;
      setPasscode("");
      setPasscodeError("");
      setShowAdminModal(true);
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 700);
    }
  };

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === "123456") {
      setIsAdminAuthenticated(true);
      setShowAdminModal(false);
      setPasscode("");
      setPasscodeError("");
      navigate({ to: "/admin" });
    } else {
      setPasscodeError("رمز الدخول غير صحيح، يرجى المحاولة مرة أخرى");
    }
  };

  const logoSrc = state.branding.mark || state.branding.logo;

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      {/* Announcement Bar */}
      {topOffer && (
        <div className="bg-foreground px-4 py-2 text-center text-xs font-bold text-background sm:text-sm">
          {topOffer.title} - {topOffer.discount}
        </div>
      )}

      <nav className="glass flex w-full items-center justify-between px-4 py-3 sm:px-6">
        <div className="hidden flex-1 items-center gap-6 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "text-foreground font-bold" }}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex-1 lg:hidden"></div>

        <div className="flex flex-1 justify-center">
          <Link
            to="/"
            onClick={handleLogoClick}
            className="tap-pulse flex items-center justify-center cursor-pointer select-none"
            title="شعار المتجر (اضغط 3 مرات للدخول للإدارة)"
          >
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={state.info.storeName || "شعار المتجر"}
                className="h-12 w-auto object-contain sm:h-14 drop-shadow-sm"
              />
            ) : (
              <span className="font-display text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {state.info.storeName || "Dubai Abaya"}
              </span>
            )}
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end gap-1.5">
          <Link
            to="/products"
            aria-label="بحث"
            className="tap-pulse grid size-9 place-items-center rounded-full bg-secondary text-secondary-foreground"
          >
            <Search className="size-4" />
          </Link>
          <button
            onClick={() => setIsCartOpen(true)}
            aria-label="السلة"
            className="tap-pulse relative grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <ShoppingBag className="size-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -left-1 grid size-5 place-items-center rounded-full bg-foreground text-[0.62rem] font-bold text-background">
                {cartCount}
              </span>
            )}
          </button>
          <button
            aria-label="القائمة"
            onClick={() => setOpen((v) => !v)}
            className="tap-pulse grid size-9 place-items-center rounded-full bg-secondary text-secondary-foreground lg:hidden"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer (Admin link completely removed) */}
      <motion.div
        initial={false}
        animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-6xl overflow-hidden lg:hidden"
      >
        <div className="glass mt-2 flex flex-col gap-1 rounded-3xl p-3">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="tap-pulse rounded-2xl px-4 py-3 text-sm text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Admin Passcode Modal (Triple click on logo) */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl text-card-foreground"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Lock className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">لوحة التحكم</h3>
                    <p className="text-xs text-muted-foreground">أدخل رمز الدخول للمتابعة</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminModal(false);
                    setPasscode("");
                    setPasscodeError("");
                  }}
                  className="tap-pulse grid size-8 place-items-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handlePasscodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2">
                    رمز الدخول (Passcode)
                  </label>
                  <input
                    type="password"
                    autoFocus
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      if (passcodeError) setPasscodeError("");
                    }}
                    placeholder="••••••"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-center text-xl font-bold tracking-widest text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {passcodeError && (
                    <p className="mt-2 text-xs font-bold text-destructive text-center animate-shake">
                      {passcodeError}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={!passcode}
                    className="flex-1 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-soft hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    دخول
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminModal(false);
                      setPasscode("");
                      setPasscodeError("");
                    }}
                    className="rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
