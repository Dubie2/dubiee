import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { formatAED, useStore } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "سلة التسوق · Dubai Abaya" },
      {
        name: "description",
        content: "راجعي قطع سلتك، عدّلي القياسات والكميات، ثم أكملي الطلب عبر واتساب.",
      },
      { property: "og:title", content: "سلة التسوق · Dubai Abaya" },
      { property: "og:description", content: "مراجعة الطلب قبل إتمام الدفع." },
    ],
  }),
  component: CartPage,
});

const SHIPPING = 35;

function CartPage() {
  const { cartDetails, cartTotal, setQty, removeLine, clearCart } = useStore();
  const shipping = cartTotal >= 1500 || cartTotal === 0 ? 0 : SHIPPING;

  return (
    <PageShell eyebrow="Cart" title="سلة التسوق" subtitle="خطوة أخيرة قبل أن تصلك القطع.">
      {cartDetails.length === 0 ? (
        <div className="glass rounded-4xl p-12 text-center">
          <ShoppingBag className="mx-auto size-8 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">سلتك فارغة حالياً.</p>
          <Link
            to="/products"
            className="tap-pulse mt-6 inline-block rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground"
          >
            تصفّحي المجموعة
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col gap-4">
            {cartDetails.map(({ line, product, total }, i) => (
              <motion.div
                key={`${line.productId}-${line.size}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="glass flex items-center gap-4 rounded-3xl p-4"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="size-20 rounded-2xl object-cover"
                />
                <div className="flex-1">
                  <Link
                    to="/products/$id"
                    params={{ id: product.id }}
                    className="font-display text-sm font-bold hover:text-primary"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">القياس {line.size}</p>
                  <p className="mt-1 text-sm font-bold text-gradient">{formatAED(total)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    aria-label="زيادة"
                    onClick={() => setQty(line.productId, line.size, line.color, line.qty + 1)}
                    className="tap-pulse grid size-8 place-items-center rounded-full bg-secondary"
                  >
                    <Plus className="size-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{line.qty}</span>
                  <button
                    aria-label="إنقاص"
                    onClick={() => setQty(line.productId, line.size, line.color, line.qty - 1)}
                    className="tap-pulse grid size-8 place-items-center rounded-full bg-secondary"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <button
                    aria-label="حذف"
                    onClick={() => removeLine(line.productId, line.size, line.color)}
                    className="tap-pulse grid size-8 place-items-center rounded-full bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}

            <button
              onClick={clearCart}
              className="self-start text-xs text-muted-foreground underline"
            >
              إفراغ السلة
            </button>
          </div>

          <div className="glass-strong h-fit rounded-4xl p-7">
            <h2 className="font-display text-lg font-bold">ملخص الطلب</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">المجموع</dt>
                <dd className="font-bold">{formatAED(cartTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">التوصيل</dt>
                <dd className="font-bold">{shipping === 0 ? "مجاني" : formatAED(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="font-bold">الإجمالي</dt>
                <dd className="font-display text-lg font-extrabold text-gradient">
                  {formatAED(cartTotal + shipping)}
                </dd>
              </div>
            </dl>

            <Link
              to="/checkout"
              className="tap-pulse mt-7 block rounded-full bg-primary py-3.5 text-center text-sm font-bold text-primary-foreground"
            >
              متابعة الدفع
            </Link>
          </div>
        </div>
      )}
    </PageShell>
  );
}
