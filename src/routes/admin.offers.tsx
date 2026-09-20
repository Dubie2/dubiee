import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Check, X, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminButton, AdminCard, Field, uploadImageFile } from "@/components/admin/AdminUI";
import { useStore, type Offer } from "@/lib/store";
import { supabase } from "@/lib/supabase";


export const Route = createFileRoute("/admin/offers")({
  component: AdminOffers,
});

function AdminOffers() {
  const { state, refreshData } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newOffer, setNewOffer] = useState({
    title: "",
    subtitle: "",
    discount: 10,
    code: "",
    productId: "",
    image: ""
  });

  const addOffer = async () => {
    if (!newOffer.title || !newOffer.code) return toast.error("يرجى إكمال العنوان وكود الخصم");
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('offers').insert([{
        title: newOffer.title,
        subtitle: newOffer.subtitle,
        discount_percentage: newOffer.discount,
        discount_code: newOffer.code,
        product_id: newOffer.productId || null,
        image_url: newOffer.image
      }]);
      if (error) throw error;
      toast.success("تمت إضافة العرض بنجاح إلى قاعدة البيانات");
      await refreshData();
      setIsAdding(false);
      setNewOffer({ title: "", subtitle: "", discount: 10, code: "", productId: "", image: "" });
    } catch (e: any) {
      console.error(e);
      toast.error("حدث خطأ أثناء الإضافة إلى قاعدة البيانات: " + (e?.message || ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateOfferDb = async (id: string, patch: Partial<Offer>) => {
    const dbPatch: any = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.subtitle !== undefined) dbPatch.subtitle = patch.subtitle;
    if (patch.discount !== undefined) dbPatch.discount_percentage = patch.discount;
    if (patch.code !== undefined) dbPatch.discount_code = patch.code;
    if (patch.productId !== undefined) dbPatch.product_id = patch.productId || null;
    if (patch.image !== undefined) dbPatch.image_url = patch.image;

    try {
      const { error } = await supabase.from('offers').update(dbPatch).eq('id', id);
      if (error) throw error;
      toast.success("تم تحديث العرض في قاعدة البيانات");
      await refreshData();
    } catch (e: any) {
      console.error(e);
      toast.error("حدث خطأ أثناء التحديث: " + (e?.message || ""));
    }
  };

  const deleteOfferDb = async (id: string) => {
    try {
      const { error } = await supabase.from('offers').delete().eq('id', id);
      if (error) throw error;
      toast.success("تم حذف العرض من قاعدة البيانات");
      await refreshData();
    } catch (e: any) {
      console.error(e);
      toast.error("حدث خطأ أثناء الحذف: " + (e?.message || ""));
    }
  };

  return (
    <AdminCard
      title="العروض"
      action={
        !isAdding && (
          <AdminButton onClick={() => setIsAdding(true)} disabled={isSubmitting}>
            <span className="flex items-center gap-1.5">
              <Plus className="size-3.5" /> إضافة عرض
            </span>
          </AdminButton>
        )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {isAdding && (
          <div className="rounded-3xl bg-primary/10 border border-primary/20 p-4 shadow-sm mb-4 sm:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-primary">عرض جديد</p>
              <div className="flex gap-2">
                <AdminButton tone="ghost" onClick={() => setIsAdding(false)}>
                  <X className="size-4" />
                </AdminButton>
                <AdminButton onClick={addOffer} disabled={isSubmitting}>
                  <Check className="size-4" /> حفظ
                </AdminButton>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-4 sm:col-span-2">
                <div className="relative size-16 rounded-xl border border-border overflow-hidden bg-background">
                  <img src={newOffer.image} className="w-full h-full object-cover" />
                </div>
                <label className="tap-pulse flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold hover:border-primary/50">
                  <Upload className="size-3.5" /> صورة العرض (بانر)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadImageFile(f, (url) => setNewOffer(s => ({ ...s, image: url })));
                    }}
                  />
                </label>
              </div>
              <Field label="العنوان" value={newOffer.title} onChange={(v) => setNewOffer(s => ({ ...s, title: v }))} />
              <Field
                label="كود الخصم"
                dir="ltr"
                value={newOffer.code}
                onChange={(v) => setNewOffer(s => ({ ...s, code: v.toUpperCase() }))}
              />
              <Field
                label="نسبة الخصم %"
                type="number"
                value={newOffer.discount}
                onChange={(v) => setNewOffer(s => ({ ...s, discount: Number(v) || 0 }))}
              />
              <label className="block">
                <span className="text-xs text-muted-foreground">مرتبط بمنتج</span>
                <select
                  value={newOffer.productId ?? ""}
                  onChange={(e) => setNewOffer(s => ({ ...s, productId: e.target.value }))}
                  className="mt-1.5 w-full rounded-2xl bg-background/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">بدون</option>
                  {state.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2">
                <Field
                  label="الوصف"
                  area
                  value={newOffer.subtitle}
                  onChange={(v) => setNewOffer(s => ({ ...s, subtitle: v }))}
                />
              </div>
            </div>
          </div>
        )}

        {state.offers.map((o) => (
          <div key={o.id} className="rounded-3xl bg-background/80 p-4">
            <div className="flex items-center gap-3 mb-4">
              <img src={o.image} alt={o.title} className="size-14 rounded-2xl object-cover" />
              <p className="flex-1 text-sm font-bold">{o.title}</p>
              <AdminButton tone="danger" onClick={() => deleteOfferDb(o.id)}>
                <Trash2 className="size-3.5" />
              </AdminButton>
            </div>
            
            <div className="flex gap-4 mb-4">
              <label className="tap-pulse flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background/50 px-4 py-2 text-xs font-bold hover:border-primary/50">
                <Upload className="size-3.5" /> تغيير صورة البانر
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImageFile(f, (url) => updateOfferDb(o.id, { image: url }));
                  }}
                />
              </label>
            </div>

            <div className="grid gap-3">
              <Field label="العنوان" value={o.title} onChange={(v) => updateOfferDb(o.id, { title: v })} />
              <Field
                label="كود الخصم"
                dir="ltr"
                value={o.code}
                onChange={(v) => updateOfferDb(o.id, { code: v.toUpperCase() })}
              />
              <Field
                label="نسبة الخصم %"
                type="number"
                value={o.discount}
                onChange={(v) => updateOfferDb(o.id, { discount: Number(v) || 0 })}
              />
              <label className="block">
                <span className="text-xs text-muted-foreground">مرتبط بمنتج</span>
                <select
                  value={o.productId ?? ""}
                  onChange={(e) => updateOfferDb(o.id, { productId: e.target.value || undefined })}
                  className="mt-1.5 w-full rounded-2xl bg-background/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">بدون</option>
                  {state.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="الوصف"
                area
                value={o.subtitle}
                onChange={(v) => updateOfferDb(o.id, { subtitle: v })}
              />
            </div>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}
