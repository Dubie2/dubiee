import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Boxes, Percent, ShoppingBag, Tags } from "lucide-react";

import { AdminCard } from "@/components/admin/AdminUI";
import { formatAED, useStore } from "@/lib/store";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { state, cartCount, cartTotal } = useStore();
  const lowStock = state.products.filter((p) => p.stock <= 5);
  const inventoryValue = state.products.reduce((n, p) => n + p.price * p.stock, 0);

  const stats = [
    { icon: Boxes, label: "منتجات", value: String(state.products.length) },
    { icon: Tags, label: "فئات", value: String(state.categories.length) },
    { icon: Percent, label: "عروض", value: String(state.offers.length) },
    { icon: ShoppingBag, label: "قطع في السلة", value: String(cartCount) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-3xl p-5">
            <s.icon className="size-4 text-primary" />
            <p className="font-display mt-3 text-2xl font-extrabold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <AdminCard title="قيمة المخزون">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-background/80 p-5">
            <p className="text-xs text-muted-foreground">إجمالي قيمة المخزون</p>
            <p className="font-display mt-2 text-xl font-extrabold text-gradient">
              {formatAED(inventoryValue)}
            </p>
          </div>
          <div className="rounded-3xl bg-background/80 p-5">
            <p className="text-xs text-muted-foreground">قيمة السلة الحالية</p>
            <p className="font-display mt-2 text-xl font-extrabold text-gradient">
              {formatAED(cartTotal)}
            </p>
          </div>
        </div>
      </AdminCard>

      <AdminCard
        title="تنبيهات المخزون"
        action={
          <Link to="/admin/products" className="text-xs font-bold text-primary underline">
            إدارة المنتجات
          </Link>
        }
      >
        {lowStock.length === 0 ? (
          <p className="text-sm text-muted-foreground">كل الكميات في مستوى جيد.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lowStock.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-2xl bg-background/80 px-4 py-3 text-sm"
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-destructive" /> {p.name}
                </span>
                <span className="text-xs text-muted-foreground">{p.stock} قطعة</span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
