import { createFileRoute } from "@tanstack/react-router";
import { Image as ImageIcon, Loader2, RotateCcw, Upload, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminButton, AdminCard, uploadImageFile } from "@/components/admin/AdminUI";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/branding")({
  component: AdminBranding,
});

function AdminBranding() {
  const { state, refreshData } = useStore();
  const { branding } = state;
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  const handleUpload = async (key: "logo" | "mark", file: File) => {
    setUploadingSlot(key);
    try {
      await uploadImageFile(file, async (url) => {
        const dbKey = key === "logo" ? "logo" : "logoMark";
        const { error } = await supabase.from("system_settings").upsert(
          {
            key_name: dbKey,
            key_value: url,
          },
          { onConflict: "key_name" }
        );

        if (error) {
          toast.error("حدث خطأ أثناء حفظ الشعار في قاعدة البيانات: " + error.message);
        } else {
          toast.success("تم حفظ الشعار في قاعدة البيانات بنجاح!");
          await refreshData();
        }
      });
    } catch (e: any) {
      toast.error("فشل رفع الشعار");
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleReset = async (key: "logo" | "mark") => {
    const dbKey = key === "logo" ? "logo" : "logoMark";
    const { error } = await supabase.from("system_settings").upsert(
      {
        key_name: dbKey,
        key_value: "",
      },
      { onConflict: "key_name" }
    );

    if (error) {
      toast.error("فشل حذف الشعار من قاعدة البيانات");
    } else {
      toast.success("تم إعادة ضبط الشعار في قاعدة البيانات");
      await refreshData();
    }
  };

  const slots = [
    {
      key: "logo" as const,
      label: "الشعار الكامل (الفوتر)",
      description: "الشعار الرسمي المكتوب كاملاً للمتجر",
      value: branding.logo,
    },
    {
      key: "mark" as const,
      label: "الشعار المصغّر (الهيدر والمجسم ثلاثي الأبعاد)",
      description: "أيقونة أو رمز المتجر المربع أو الدائري",
      value: branding.mark,
    },
  ];

  return (
    <AdminCard title="الشعار والهوية">
      <div className="mb-4 flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-3 text-xs font-semibold text-primary">
        <CheckCircle2 className="size-4 shrink-0" />
        <span>يتم رفع وحفظ جميع الشعارات مباشرة في قاعدة بيانات Supabase (سوبابيس).</span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {slots.map((s) => (
          <div key={s.key} className="rounded-3xl bg-background/80 p-5 border border-border/60 shadow-sm">
            <div className="mb-2">
              <p className="text-sm font-bold text-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </div>

            <div className="fairy-bg mt-3 grid h-44 place-items-center rounded-2xl border border-dashed border-border/80 bg-secondary/20 p-4">
              {s.value ? (
                <img
                  src={s.value}
                  alt={s.label}
                  className="max-h-36 max-w-full object-contain drop-shadow"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
                  <ImageIcon className="size-10" />
                  <span className="text-xs font-medium">لم يتم رفع شعار بعد</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <label className="tap-pulse flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-soft hover:bg-primary/90 transition">
                {uploadingSlot === s.key ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> جاري الحفظ في قاعدة البيانات...
                  </>
                ) : (
                  <>
                    <Upload className="size-3.5" /> رفع وحفظ في قاعدة البيانات
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  disabled={uploadingSlot !== null}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(s.key, f);
                  }}
                />
              </label>

              {s.value && (
                <AdminButton tone="ghost" onClick={() => handleReset(s.key)}>
                  <span className="flex items-center gap-1.5">
                    <RotateCcw className="size-3.5" /> مسح الشعار
                  </span>
                </AdminButton>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-muted-foreground">
        يُفضّل رفع شعار بصيغة PNG بخلفية شفافة لأفضل ظهور متناسق داخل الموقع.
      </p>
    </AdminCard>
  );
}
