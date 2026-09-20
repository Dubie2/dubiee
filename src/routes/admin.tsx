import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { Boxes, Gift, Home, Image, Info, LayoutDashboard, Lock, LogOut, Percent, Tags } from "lucide-react";
import { useState } from "react";

import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الإدارة · Dubai Abaya" },
      {
        name: "description",
        content: "إدارة المخزون والفئات والعروض ومعلومات المتجر وشعاره من لوحة تحكم واحدة.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "لوحة الإدارة · Dubai Abaya" },
      { property: "og:description", content: "تحكم كامل بمحتوى المتجر." },
    ],
  }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "المنتجات والمخزون", icon: Boxes },
  { to: "/admin/categories", label: "الفئات", icon: Tags },
  { to: "/admin/offers", label: "العروض", icon: Percent },
  { to: "/admin/lottery", label: "السحب الأسبوعي", icon: Gift },
  { to: "/admin/info", label: "المعلومات", icon: Info },
  { to: "/admin/branding", label: "الشعار والهوية", icon: Image },
] as const;

function AdminLayout() {
  const { state, isAdminAuthenticated, setIsAdminAuthenticated } = useStore();
  const navigate = useNavigate();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === "123456") {
      setIsAdminAuthenticated(true);
      setError("");
      setPasscode("");
    } else {
      setError("رمز الدخول غير صحيح");
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    navigate({ to: "/" });
  };

  // If not authenticated, require passcode 123456
  if (!isAdminAuthenticated) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-secondary/40 p-4">
        <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl text-card-foreground">
          <div className="flex flex-col items-center gap-3 text-center pb-4 mb-4 border-b border-border/50">
            <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="size-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">الدخول إلى لوحة التحكم</h2>
              <p className="text-xs text-muted-foreground mt-1">يرجى إدخال رمز المرور للمتابعة</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2 text-right">
                رمز الدخول
              </label>
              <input
                type="password"
                autoFocus
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError("");
                }}
                placeholder="••••••"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-center text-xl font-bold tracking-widest text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {error && (
                <p className="mt-2 text-xs font-bold text-destructive text-center">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!passcode}
              className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-soft hover:bg-primary/90 transition disabled:opacity-50"
            >
              تسجيل الدخول
            </button>

            <Link
              to="/"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground hover:bg-secondary transition"
            >
              <Home className="size-4" /> العودة للمتجر
            </Link>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="relative min-h-screen bg-secondary/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="glass h-fit rounded-4xl p-4 lg:sticky lg:top-6 lg:w-64">
          <div className="flex items-center gap-2.5 px-2 pb-4">
            {state.branding.mark || state.branding.logo ? (
              <img src={state.branding.mark || state.branding.logo} alt="الشعار" className="size-8 object-contain" />
            ) : null}
            <span className="font-display text-sm font-extrabold">لوحة الإدارة</span>
          </div>
          <nav className="flex flex-row gap-1.5 overflow-x-auto lg:flex-col">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: "exact" in n && n.exact }}
                activeProps={{ className: "bg-primary text-primary-foreground" }}
                className="tap-pulse flex shrink-0 items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold text-secondary-foreground"
              >
                <n.icon className="size-4" />
                {n.label}
              </Link>
            ))}
            <Link
              to="/"
              className="tap-pulse flex shrink-0 items-center gap-2.5 rounded-2xl px-4 py-3 text-sm text-muted-foreground"
            >
              <Home className="size-4" /> عودة للمتجر
            </Link>
            <button
              onClick={handleLogout}
              className="tap-pulse flex shrink-0 items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10 transition"
            >
              <LogOut className="size-4" /> تسجيل الخروج
            </button>
          </nav>
        </aside>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
