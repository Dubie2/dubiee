import { createFileRoute, Link } from "@tanstack/react-router";
import { Banknote, CreditCard, MessageCircle, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
import { formatAED, useStore, whatsappLink } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "إتمام الطلب · Dubai Abaya" },
      {
        name: "description",
        content: "أدخلي بياناتك واختاري طريقة الدفع، ثم أرسلي الطلب مباشرة إلى واتساب المتجر.",
      },
      { property: "og:title", content: "إتمام الطلب · Dubai Abaya" },
      { property: "og:description", content: "الدفع عند الاستلام أو تحويل بنكي مع تأكيد واتساب." },
    ],
  }),
  component: CheckoutPage,
});

const methods = [
  { id: "cod", label: "الدفع عند الاستلام", icon: Truck },
  { id: "bank_wallet", label: "دفع بنكي ومحافظ", icon: Banknote },
  { id: "card", label: "بطاقة (قريباً)", icon: CreditCard },
] as const;

function CheckoutPage() {
  const { state, cartDetails, cartTotal, clearCart } = useStore();
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "", note: "", receiptRef: "", mapLink: "" });
  const [method, setMethod] = useState<string>("cod");
  const [bankType, setBankType] = useState<"wallet" | "bank">("wallet");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const shipping = cartTotal >= 1500 || cartTotal === 0 ? 0 : 35;
  const grand = cartTotal + shipping;
  const methodLabel = methods.find((m) => m.id === method)?.label ?? "";
  const ready = form.name.trim() !== "" && form.phone.trim() !== "" && cartDetails.length > 0 && (method === "cod" || form.receiptRef.trim() !== "");

  const message = [
    `طلب جديد من ${state.info.storeName}`,
    "",
    ...cartDetails.map(
      (d) => `• ${d.product.name} — قياس ${d.line.size}${d.line.color ? ` — لون ${d.line.color}` : ''} × ${d.line.qty} = ${formatAED(d.total)}`,
    ),
    "",
    `التوصيل: ${shipping === 0 ? "مجاني" : formatAED(shipping)}`,
    `الإجمالي: ${formatAED(grand)}`,
    `طريقة الدفع: ${methodLabel}`,
    "",
    `الاسم: ${form.name}`,
    `الهاتف: ${form.phone}`,
    `المدينة: ${form.city}`,
    `العنوان: ${form.address}`,
    form.mapLink ? `رابط الموقع (GPS): ${form.mapLink}` : "",
    method === "bank_wallet" ? `رقم الإيصال/المرجع: ${form.receiptRef}` : "",
    form.note ? `ملاحظات: ${form.note}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const field = (
    key: keyof typeof form,
    label: string,
    opts?: { area?: boolean; dir?: "ltr" | "rtl" },
  ) => (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      {opts?.area ? (
        <textarea
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          rows={3}
          className="mt-1.5 w-full rounded-2xl bg-background/70 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <input
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          dir={opts?.dir ?? "rtl"}
          className="mt-1.5 w-full rounded-2xl bg-background/70 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      )}
    </label>
  );

  const handleSubmit = async () => {
    if (!ready || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const items = cartDetails.map(d => ({
        product_id: d.product.id,
        name: d.product.name,
        size: d.line.size,
        color: d.line.color,
        qty: d.line.qty,
        total: d.total
      }));

      const { error } = await supabase.from('orders').insert([{
        customer_name: form.name,
        customer_phone: form.phone,
        delivery_address_link: form.mapLink || form.city, // fallback to city if no GPS
        delivery_address_text: `${form.city} - ${form.address}`,
        bank_deposit_reference: method === 'bank_wallet' ? form.receiptRef : 'COD',
        total_amount: grand,
        items: items,
        status: method === 'bank_wallet' ? 'pending_verification' : 'processing'
      }]);

      if (error) {
        throw new Error(error.message);
      }

      // Success
      clearCart();
      setSent(true);
      window.open(whatsappLink(state.info.whatsapp, message), "_blank");
    } catch (err: any) {
      console.error("Order submission failed", err);
      setErrorMsg("حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const captureGPS = () => {
    if (!navigator.geolocation) {
      toast.error("متصفحك لا يدعم تحديد الموقع.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const link = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
        setForm({ ...form, mapLink: link });
        toast.success("تم تحديد موقعك الجغرافي بنجاح");
      },
      (err) => {
        console.error("GPS Error", err);
        toast.error("لم نتمكن من تحديد موقعك. يرجى التأكد من تفعيل خدمة الموقع (GPS).");
      }
    );
  };

  if (sent) {
    return (
      <PageShell title="تم إرسال طلبك" subtitle="سنؤكد التفاصيل معك عبر واتساب قريباً.">
        <div className="glass rounded-4xl p-12 text-center">
          <MessageCircle className="mx-auto size-8 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">شكراً لثقتك بـ Dubai Abaya ✦</p>
          <Link
            to="/products"
            className="tap-pulse mt-6 inline-block rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground"
          >
            متابعة التسوق
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Checkout"
      title="إتمام الطلب"
      subtitle="بياناتك تُرسل مباشرة إلى واتساب المتجر لتأكيد الطلب."
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass-strong rounded-4xl p-7">
          <h2 className="font-display text-lg font-bold">بيانات التوصيل</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {field("name", "الاسم الكامل")}
            {field("phone", "رقم الهاتف", { dir: "ltr" })}
            {field("city", "المدينة")}
            {field("address", "العنوان")}
          </div>
          
          <div className="mt-4 flex flex-col gap-2">
            {field("mapLink", "رابط الموقع (اختياري)", { dir: "ltr" })}
            <button
              onClick={captureGPS}
              type="button"
              className="tap-pulse w-fit rounded-full bg-secondary/80 px-4 py-2 text-xs font-bold text-secondary-foreground hover:bg-secondary"
            >
              📍 تحديد موقعي الحالي (GPS)
            </button>
          </div>

          <div className="mt-4">{field("note", "ملاحظات (اختياري)", { area: true })}</div>

          <h2 className="font-display mt-7 text-lg font-bold">طريقة الدفع</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                disabled={m.id === "card"}
                className={`tap-pulse flex flex-col items-center gap-2 rounded-3xl px-4 py-5 text-xs font-semibold disabled:opacity-45 ${
                  method === m.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <m.icon className="size-4" />
                {m.label}
              </button>
            ))}
          </div>

          {method === "bank_wallet" && (
            <div className="mt-5 space-y-4 rounded-3xl bg-background/70 p-5">
              <div className="flex rounded-2xl bg-secondary/50 p-1">
                <button
                  onClick={() => setBankType("wallet")}
                  className={`tap-pulse flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                    bankType === "wallet" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  المحافظ الإلكترونية
                </button>
                <button
                  onClick={() => setBankType("bank")}
                  className={`tap-pulse flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                    bankType === "bank" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  الحسابات البنكية
                </button>
              </div>

              {bankType === "wallet" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    حوّلي المبلغ لأحد المحافظ التالية وأرسلي رقم الحوالة:
                  </p>
                  {(state.info.wallets || []).map((w) => (
                    <div key={w.id} className="flex justify-between rounded-2xl bg-background/50 px-4 py-3 text-sm">
                      <span className="font-bold">{w.name}</span>
                      <span className="font-medium tracking-wide text-primary" dir="ltr">{w.number}</span>
                    </div>
                  ))}
                </div>
              )}

              {bankType === "bank" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    حوّلي المبلغ إلى أحد الحسابات التالية وأرسلي رقم الإيصال:
                  </p>
                  {(state.info.banks || []).map((b) => (
                    <div key={b.id} className="rounded-2xl bg-background/50 p-4 text-sm">
                      <p className="font-bold">{b.bank}</p>
                      <div className="mt-2 flex justify-between text-xs">
                        <span className="text-muted-foreground">{b.holder}</span>
                        <span className="font-medium tracking-wider text-primary" dir="ltr">{b.iban}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="pt-3">
                {field("receiptRef", "رقم الإيصال / مرجع الحوالة (مطلوب)", { dir: "ltr" })}
              </div>
            </div>
          )}
        </div>

        <div className="glass-strong h-fit rounded-4xl p-7">
          <h2 className="font-display text-lg font-bold">ملخص</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {cartDetails.map((d) => (
              <li key={`${d.line.productId}-${d.line.size}-${d.line.color || 'none'}`} className="flex flex-col gap-1">
                <div className="flex justify-between gap-3">
                  <span className="text-foreground font-semibold">
                    {d.product.name} × {d.line.qty}
                  </span>
                  <span className="font-bold">{formatAED(d.total)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>القياس: {d.line.size}</span>
                  {d.line.color && (
                    <>
                      <span>·</span>
                      <span>اللون: {d.line.color}</span>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-3">
            <span className="font-bold">الإجمالي</span>
            <span className="font-display text-lg font-extrabold text-gradient">
              {formatAED(grand)}
            </span>
          </div>

          {errorMsg && (
            <div className="mt-4 rounded-xl bg-destructive/15 p-3 text-sm text-destructive">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!ready || isSubmitting}
            className={`tap-pulse mt-7 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold ${
              ready && !isSubmitting
                ? "bg-primary text-primary-foreground"
                : "pointer-events-none bg-secondary text-muted-foreground"
            }`}
          >
            {isSubmitting ? (
              "جاري إرسال الطلب..."
            ) : (
              <>
                <MessageCircle className="size-4" /> إرسال الطلب وتأكيد عبر واتساب
              </>
            )}
          </button>
          {!ready && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              أكملي الاسم ورقم الهاتف وتأكدي أن السلة غير فارغة.
            </p>
          )}
        </div>
      </div>
    </PageShell>
  );
}
