import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Upload, Check, X, Star, Loader2, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminButton, AdminCard, Field, uploadImageFile } from "@/components/admin/AdminUI";
import { useStore, type Product } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

interface NewProductForm {
  name: string;
  tag: string;
  price: number;
  oldPrice: number;
  stock: number;
  colors: string;
  fabric: string;
  categoryId: string;
  sizes: string;
  description: string;
  images: string[];
}

const initialNewProd: NewProductForm = {
  name: "",
  tag: "جديد",
  price: 0,
  oldPrice: 0,
  stock: 5,
  colors: "",
  fabric: "",
  categoryId: "",
  sizes: "S, M, L",
  description: "",
  images: [],
};

function AdminProducts() {
  const { state, refreshData } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newProd, setNewProd] = useState<NewProductForm>(initialNewProd);

  const handleUploadMultiple = async (
    files: FileList | null,
    onSuccess: (urls: string[]) => void
  ) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        await new Promise<void>((resolve) => {
          uploadImageFile(file, (url) => {
            urls.push(url);
            resolve();
          });
        });
      }
      if (urls.length > 0) {
        onSuccess(urls);
      }
    } catch (e) {
      console.error(e);
      toast.error("حدث خطأ أثناء رفع الصور إلى قاعدة البيانات");
    } finally {
      setIsUploading(false);
    }
  };

  const addProduct = async () => {
    if (!newProd.name.trim() || !newProd.price || !newProd.categoryId) {
      return toast.error("الرجاء إدخال الاسم والسعر واختيار الفئة");
    }

    setIsSubmitting(true);
    try {
      const allImgs = newProd.images.filter(Boolean);
      const mainPrice = Number(newProd.price) || 0;
      const oldPriceNum = Number(newProd.oldPrice) || 0;

      let dbPrice = mainPrice;
      let dbDiscountPrice: number | null = null;
      if (oldPriceNum > mainPrice) {
        dbPrice = oldPriceNum;
        dbDiscountPrice = mainPrice;
      }

      const { data, error } = await supabase
        .from("products")
        .insert([
          {
            title: newProd.name.trim(),
            description: newProd.description.trim(),
            price: dbPrice,
            discount_price: dbDiscountPrice,
            category_id: newProd.categoryId,
            images: allImgs,
            sizes: newProd.sizes
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            colors: newProd.colors
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean),
            fabric: newProd.fabric.trim() || null,
            stock: Number(newProd.stock) || 0,
            is_available: (Number(newProd.stock) || 0) > 0,
            is_featured: newProd.tag === "موصى به" || newProd.tag === "جديد",
            tag: newProd.tag.trim() || "جديد",
          },
        ])
        .select("*")
        .single();

      if (error) throw error;

      toast.success("تمت إضافة المنتج بنجاح إلى قاعدة البيانات");
      await refreshData();
      setIsAdding(false);
      setNewProd(initialNewProd);
      if (data) setOpenId(data.id);
    } catch (e: any) {
      console.error(e);
      toast.error("حدث خطأ أثناء إضافة المنتج: " + (e?.message || ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateProductDb = async (id: string, patch: Partial<Product>) => {
    const dbPatch: any = {};
    if (patch.name !== undefined) dbPatch.title = patch.name;
    if (patch.price !== undefined || patch.oldPrice !== undefined) {
      const current = state.products.find((p) => p.id === id);
      const newPrice = patch.price !== undefined ? Number(patch.price) : current?.price || 0;
      const newOldPrice = patch.oldPrice !== undefined ? Number(patch.oldPrice) : current?.oldPrice || 0;

      if (newOldPrice > newPrice && newPrice > 0) {
        dbPatch.price = newOldPrice;
        dbPatch.discount_price = newPrice;
      } else {
        dbPatch.price = newPrice;
        dbPatch.discount_price = null;
      }
    }
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.categoryId !== undefined) dbPatch.category_id = patch.categoryId;
    if (patch.sizes !== undefined) dbPatch.sizes = patch.sizes;
    if (patch.colors !== undefined || patch.color !== undefined) {
      const c = patch.colors || (patch.color ? [patch.color] : []);
      dbPatch.colors = c;
    }
    if (patch.fabric !== undefined) dbPatch.fabric = patch.fabric;
    if (patch.stock !== undefined) {
      dbPatch.stock = Number(patch.stock);
      dbPatch.is_available = Number(patch.stock) > 0;
    }
    if (patch.tag !== undefined) {
      dbPatch.tag = patch.tag;
      dbPatch.is_featured = patch.tag === "موصى به" || patch.tag === "جديد";
    }

    const currentProd = state.products.find((p) => p.id === id);
    if (patch.images !== undefined) dbPatch.images = patch.images;
    if (patch.image !== undefined && currentProd) {
      dbPatch.images = [patch.image, ...(currentProd.images?.slice(1) || [])];
    }

    try {
      const { error } = await supabase.from("products").update(dbPatch).eq("id", id);
      if (error) throw error;
      toast.success("تم تحديث المنتج في قاعدة البيانات بنجاح");
      await refreshData();
    } catch (e: any) {
      console.error(e);
      toast.error("حدث خطأ أثناء التحديث: " + (e?.message || ""));
    }
  };

  const deleteProductDb = async (id: string) => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("تم حذف المنتج من قاعدة البيانات");
      await refreshData();
    } catch (e: any) {
      console.error(e);
      toast.error("حدث خطأ أثناء الحذف: " + (e?.message || ""));
    }
  };

  return (
    <AdminCard
      title="المنتجات والمخزون"
      action={
        !isAdding && (
          <AdminButton onClick={() => setIsAdding(true)} disabled={isSubmitting}>
            <span className="flex items-center gap-1.5">
              <Plus className="size-3.5" /> إضافة منتج
            </span>
          </AdminButton>
        )
      }
    >
      <div className="flex flex-col gap-4">
        {/* ADD NEW PRODUCT FORM */}
        {isAdding && (
          <div className="rounded-3xl bg-primary/10 border border-primary/20 p-5 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-4 border-b border-primary/20 pb-3">
              <p className="text-sm font-bold text-primary flex items-center gap-2">
                <Plus className="size-4" /> إضافة منتج جديد
              </p>
              <div className="flex gap-2">
                <AdminButton tone="ghost" onClick={() => setIsAdding(false)}>
                  <X className="size-4" /> إلغاء
                </AdminButton>
                <AdminButton onClick={addProduct} disabled={isSubmitting || isUploading}>
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  <span>حفظ المنتج</span>
                </AdminButton>
              </div>
            </div>

            {/* MULTI-IMAGE UPLOADER FOR NEW PRODUCT */}
            <div className="mb-6 rounded-2xl bg-background/80 p-4 border border-border/60">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <p className="text-xs font-bold text-foreground">صور المنتج (معرض الصور)</p>
                  <p className="text-[11px] text-muted-foreground">
                    يمكنك اختيار أكثر من صورة معاً. الصورة الأولى هي الصورة الرئيسية للغلاف.
                  </p>
                </div>
                <label className="tap-pulse flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90">
                  {isUploading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Upload className="size-3.5" />
                  )}
                  <span>{isUploading ? "جاري الرفع..." : "+ رفع صور المنتج"}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={isUploading}
                    className="hidden"
                    onChange={(e) =>
                      handleUploadMultiple(e.target.files, (urls) =>
                        setNewProd((s) => ({ ...s, images: [...s.images, ...urls] }))
                      )
                    }
                  />
                </label>
              </div>

              {newProd.images.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl text-center">
                  <ImageIcon className="size-8 text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground">لم يتم رفع أي صور بعد. اضغط على الزر أعلاه لإضافة صور المنتج.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {newProd.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="group relative size-24 rounded-2xl border border-border overflow-hidden bg-background shadow-xs"
                    >
                      <img src={img} className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute bottom-1 right-1 rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground shadow-xs">
                          الرئيسية
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        {idx !== 0 && (
                          <button
                            type="button"
                            title="تعيين كصورة رئيسية"
                            onClick={() =>
                              setNewProd((s) => {
                                const copy = [...s.images];
                                const [selected] = copy.splice(idx, 1);
                                if (selected) copy.unshift(selected);
                                return { ...s, images: copy };
                              })
                            }
                            className="grid size-6 place-items-center rounded-full bg-background text-amber-500 hover:scale-110"
                          >
                            <Star className="size-3 fill-current" />
                          </button>
                        )}
                        <button
                          type="button"
                          title="حذف الصورة"
                          onClick={() =>
                            setNewProd((s) => ({
                              ...s,
                              images: s.images.filter((_, i) => i !== idx),
                            }))
                          }
                          className="grid size-6 place-items-center rounded-full bg-background text-destructive hover:scale-110"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FORM FIELDS MATCHING USER SPECIFICATIONS */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="الاسم"
                value={newProd.name}
                onChange={(v) => setNewProd((s) => ({ ...s, name: v }))}
              />
              <Field
                label="الوسم"
                value={newProd.tag}
                onChange={(v) => setNewProd((s) => ({ ...s, tag: v }))}
              />
              <Field
                label="السعر (د.إ)"
                type="number"
                value={newProd.price || ""}
                onChange={(v) => setNewProd((s) => ({ ...s, price: Number(v) }))}
              />
              <Field
                label="السعر قبل الخصم (اختياري)"
                type="number"
                value={newProd.oldPrice || ""}
                onChange={(v) => setNewProd((s) => ({ ...s, oldPrice: Number(v) }))}
              />
              <Field
                label="المخزون"
                type="number"
                value={newProd.stock}
                onChange={(v) => setNewProd((s) => ({ ...s, stock: Number(v) }))}
              />
              <Field
                label="اللون (مفصولة بفاصلة)"
                value={newProd.colors}
                onChange={(v) => setNewProd((s) => ({ ...s, colors: v }))}
              />
              <Field
                label="نوع القماش"
                value={newProd.fabric}
                onChange={(v) => setNewProd((s) => ({ ...s, fabric: v }))}
              />
              <label className="block">
                <span className="text-xs text-muted-foreground">الفئة</span>
                <select
                  value={newProd.categoryId}
                  onChange={(e) => setNewProd((s) => ({ ...s, categoryId: e.target.value }))}
                  className="mt-1.5 w-full rounded-2xl bg-background/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">-- اختر الفئة --</option>
                  {state.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="القياسات (مفصولة بفاصلة)"
                value={newProd.sizes}
                onChange={(v) => setNewProd((s) => ({ ...s, sizes: v }))}
              />
              <div className="sm:col-span-2">
                <Field
                  label="الوصف"
                  area
                  value={newProd.description}
                  onChange={(v) => setNewProd((s) => ({ ...s, description: v }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS LIST */}
        {state.products.map((p) => (
          <div key={p.id} className="rounded-3xl bg-background/80 p-4 border border-border/40">
            <div className="flex items-center gap-4">
              <img
                src={p.image || p.images?.[0] || "/src/assets/abaya-1.jpg"}
                alt={p.name}
                className="size-16 rounded-2xl object-cover border border-border/50"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {state.categories.find((c) => c.id === p.categoryId)?.name ?? "—"} · {p.price} د.إ
                  · مخزون {p.stock}
                  {p.images && p.images.length > 1 && (
                    <span className="mr-2 text-primary font-bold">({p.images.length} صور)</span>
                  )}
                </p>
              </div>
              <AdminButton tone="ghost" onClick={() => setOpenId(openId === p.id ? null : p.id)}>
                {openId === p.id ? "إغلاق" : "تعديل"}
              </AdminButton>
              <AdminButton tone="danger" onClick={() => deleteProductDb(p.id)}>
                <Trash2 className="size-3.5" />
              </AdminButton>
            </div>

            {/* EDIT PRODUCT ACCORDION */}
            {openId === p.id && (
              <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                <Field
                  label="الاسم"
                  value={p.name}
                  onChange={(v) => updateProductDb(p.id, { name: v })}
                />
                <Field
                  label="الوسم"
                  value={p.tag}
                  onChange={(v) => updateProductDb(p.id, { tag: v })}
                />
                <Field
                  label="السعر الحالي (د.إ)"
                  type="number"
                  value={p.price}
                  onChange={(v) => updateProductDb(p.id, { price: Number(v) || 0 })}
                />
                <Field
                  label="السعر قبل الخصم (للعرض فقط)"
                  type="number"
                  value={p.oldPrice ?? 0}
                  onChange={(v) => updateProductDb(p.id, { oldPrice: Number(v) || undefined })}
                />
                <Field
                  label="المخزون"
                  type="number"
                  value={p.stock}
                  onChange={(v) => updateProductDb(p.id, { stock: Number(v) || 0 })}
                />
                <Field
                  label="نوع القماش"
                  value={p.fabric || ""}
                  onChange={(v) => updateProductDb(p.id, { fabric: v })}
                />
                <label className="block">
                  <span className="text-xs text-muted-foreground">الفئة</span>
                  <select
                    value={p.categoryId}
                    onChange={(e) => updateProductDb(p.id, { categoryId: e.target.value })}
                    className="mt-1.5 w-full rounded-2xl bg-background/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">-- اختر الفئة --</option>
                    {state.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  label="القياسات (مفصولة بفاصلة)"
                  value={p.sizes.join(", ")}
                  onChange={(v) =>
                    updateProductDb(p.id, {
                      sizes: v
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
                <Field
                  label="الألوان (مفصولة بفاصلة)"
                  value={p.colors?.join(", ") || p.color || ""}
                  onChange={(v) =>
                    updateProductDb(p.id, {
                      colors: v
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
                <div className="sm:col-span-2">
                  <Field
                    label="الوصف"
                    area
                    value={p.description}
                    onChange={(v) => updateProductDb(p.id, { description: v })}
                  />
                </div>

                {/* EDIT GALLERY */}
                <div className="sm:col-span-2 pt-2 border-t border-border mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold">معرض الصور ({p.images?.length || 0} صور)</p>
                    <label className="tap-pulse flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold text-foreground hover:border-primary/50">
                      {isUploading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Plus className="size-3.5" />
                      )}
                      <span>{isUploading ? "جاري الرفع..." : "+ إضافة صور للمعرض"}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        disabled={isUploading}
                        className="hidden"
                        onChange={(e) =>
                          handleUploadMultiple(e.target.files, (urls) =>
                            updateProductDb(p.id, { images: [...(p.images || []), ...urls] })
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {p.images?.map((img, idx) => (
                      <div
                        key={idx}
                        className="group relative size-24 rounded-2xl border border-border overflow-hidden bg-background shadow-xs"
                      >
                        <img src={img} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-1 right-1 rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground shadow-xs">
                            الرئيسية
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          {idx !== 0 && (
                            <button
                              type="button"
                              title="تعيين كصورة رئيسية"
                              onClick={() => {
                                const copy = [...(p.images || [])];
                                const [selected] = copy.splice(idx, 1);
                                if (selected) copy.unshift(selected);
                                updateProductDb(p.id, { images: copy });
                              }}
                              className="grid size-6 place-items-center rounded-full bg-background text-amber-500 hover:scale-110"
                            >
                              <Star className="size-3 fill-current" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="حذف الصورة"
                            onClick={() =>
                              updateProductDb(p.id, {
                                images: p.images!.filter((_, i) => i !== idx),
                              })
                            }
                            className="grid size-6 place-items-center rounded-full bg-background text-destructive hover:scale-110"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminCard>
  );
}
