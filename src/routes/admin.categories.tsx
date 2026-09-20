import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Check, X, Upload, Edit3, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminButton, AdminCard, Field, uploadImageFile } from "@/components/admin/AdminUI";
import { useStore, type Category } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

function AdminCategories() {
  const { state, refreshData } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", slug: "", image: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; slug: string; image: string }>({
    name: "",
    slug: "",
    image: "",
  });

  const addCategory = async () => {
    if (!newCat.name.trim()) return toast.error("يرجى إدخال اسم الفئة");
    const slug = newCat.slug.trim() || newCat.name.trim().toLowerCase().replace(/\s+/g, "-");
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("categories").insert([
        {
          name_ar: newCat.name.trim(),
          slug,
          image_url: newCat.image,
        },
      ]);
      if (error) throw error;
      toast.success("تمت إضافة الفئة بنجاح");
      await refreshData();
      setIsAdding(false);
      setNewCat({ name: "", slug: "", image: "" });
    } catch (e: any) {
      console.error(e);
      toast.error("حدث خطأ أثناء الإضافة: " + (e?.message || ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditForm({
      name: c.name,
      slug: c.description,
      image: c.image,
    });
  };

  const saveEdit = async (id: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("categories")
        .update({
          name_ar: editForm.name.trim(),
          slug: editForm.slug.trim(),
          image_url: editForm.image,
        })
        .eq("id", id);
      if (error) throw error;
      toast.success("تم حفظ تعديلات الفئة بنجاح");
      await refreshData();
      setEditingId(null);
    } catch (e: any) {
      console.error(e);
      toast.error("حدث خطأ أثناء التعديل: " + (e?.message || ""));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCategoryDb = async (id: string) => {
    if (!confirm("هل أنت متأكد من رغبتك بحذف هذه الفئة؟")) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("تم حذف الفئة بنجاح");
      await refreshData();
    } catch (e: any) {
      console.error(e);
      toast.error("حدث خطأ أثناء الحذف: " + (e?.message || ""));
    }
  };

  return (
    <AdminCard
      title="إدارة الفئات والمجموعات"
      action={
        !isAdding && (
          <AdminButton onClick={() => setIsAdding(true)} disabled={isSubmitting}>
            <span className="flex items-center gap-1.5">
              <Plus className="size-3.5" /> إضافة فئة جديدة
            </span>
          </AdminButton>
        )
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {isAdding && (
          <div className="rounded-3xl bg-primary/10 border border-primary/30 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-primary/20">
              <p className="text-sm font-bold text-primary flex items-center gap-2">
                <Sparkles className="size-4" /> فئة جديدة
              </p>
              <div className="flex gap-2">
                <AdminButton tone="ghost" onClick={() => setIsAdding(false)}>
                  <X className="size-4" /> إلغاء
                </AdminButton>
                <AdminButton onClick={addCategory} disabled={isSubmitting}>
                  <Check className="size-4" /> حفظ الفئة
                </AdminButton>
              </div>
            </div>
            <div className="grid gap-3.5">
              <div className="flex items-center gap-4">
                <div className="relative size-16 rounded-2xl border border-border overflow-hidden bg-background flex items-center justify-center">
                  {newCat.image ? (
                    <img src={newCat.image} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">صورة</span>
                  )}
                </div>
                <label className="tap-pulse flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold hover:border-primary/50">
                  <Upload className="size-3.5" /> رفع صورة الفئة
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadImageFile(f, (url) => setNewCat((s) => ({ ...s, image: url })));
                    }}
                  />
                </label>
              </div>
              <Field
                label="اسم الفئة (عربي)"
                value={newCat.name}
                onChange={(v) => setNewCat((s) => ({ ...s, name: v }))}
              />
              <Field
                label="المعرف (Slug - إنجليزي أو اختياري)"
                value={newCat.slug}
                onChange={(v) => setNewCat((s) => ({ ...s, slug: v }))}
              />
            </div>
          </div>
        )}

        {state.categories.map((c) => {
          const isEditing = editingId === c.id;

          if (isEditing) {
            return (
              <div key={c.id} className="rounded-3xl bg-card border border-primary/40 p-5 shadow-md">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                  <p className="text-sm font-bold text-primary">تعديل الفئة</p>
                  <div className="flex gap-2">
                    <AdminButton tone="ghost" onClick={() => setEditingId(null)}>
                      <X className="size-3.5" /> إلغاء
                    </AdminButton>
                    <AdminButton onClick={() => saveEdit(c.id)} disabled={isSubmitting}>
                      <Check className="size-3.5" /> حفظ التعديل
                    </AdminButton>
                  </div>
                </div>

                <div className="grid gap-3.5">
                  <div className="flex items-center gap-4">
                    <div className="relative size-16 rounded-2xl border border-border overflow-hidden bg-background">
                      {editForm.image ? (
                        <img src={editForm.image} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">بدون صورة</span>
                      )}
                    </div>
                    <label className="tap-pulse flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold hover:border-primary/50">
                      <Upload className="size-3.5" /> تغيير الصورة
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadImageFile(f, (url) => setEditForm((s) => ({ ...s, image: url })));
                        }}
                      />
                    </label>
                  </div>

                  <Field
                    label="الاسم (عربي)"
                    value={editForm.name}
                    onChange={(v) => setEditForm((s) => ({ ...s, name: v }))}
                  />
                  <Field
                    label="المعرف (Slug)"
                    value={editForm.slug}
                    onChange={(v) => setEditForm((s) => ({ ...s, slug: v }))}
                  />
                </div>
              </div>
            );
          }

          return (
            <div
              key={c.id}
              className="rounded-3xl bg-background/80 p-5 border border-border/70 flex flex-col justify-between shadow-sm transition hover:border-primary/40"
            >
              <div className="flex items-center gap-3.5">
                {c.image ? (
                  <img src={c.image} alt={c.name} className="size-16 rounded-2xl object-cover border border-border" />
                ) : (
                  <div className="size-16 rounded-2xl bg-secondary/50 flex items-center justify-center text-xs font-bold text-muted-foreground">
                    بدون صورة
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-foreground truncate">{c.name}</p>
                  {c.description && (
                    <p className="text-xs text-muted-foreground truncate">{c.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-border/50">
                <AdminButton tone="ghost" onClick={() => startEdit(c)}>
                  <span className="flex items-center gap-1.5">
                    <Edit3 className="size-3.5" /> تعديل
                  </span>
                </AdminButton>
                <AdminButton tone="danger" onClick={() => deleteCategoryDb(c.id)}>
                  <Trash2 className="size-3.5" />
                </AdminButton>
              </div>
            </div>
          );
        })}
      </div>
    </AdminCard>
  );
}
