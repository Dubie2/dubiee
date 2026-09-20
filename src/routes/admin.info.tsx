import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, Save, Sparkles, Building2, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { AdminButton, AdminCard, Field, uploadImageFile } from "@/components/admin/AdminUI";
import { uid, useStore, type SiteInfo, type Branding, type BankAccount, type WalletAccount } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/info")({
  component: AdminInfo,
});

function AdminInfo() {
  const { state, refreshData } = useStore();
  const [info, setInfoState] = useState<SiteInfo>(state.info);
  const [branding, setBrandingState] = useState<Branding>(state.branding);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with store when data updates
  useEffect(() => {
    if (state.info) setInfoState(state.info);
    if (state.branding) setBrandingState(state.branding);
  }, [state.info, state.branding]);

  const setInfo = (patch: Partial<SiteInfo>) => setInfoState((s) => ({ ...s, ...patch }));
  const setBranding = (patch: Partial<Branding>) => setBrandingState((s) => ({ ...s, ...patch }));

  const saveToDb = async () => {
    setIsSaving(true);
    try {
      // 1. Save Settings and Branding
      const settingsToSave = [
        { key_name: "storeName", key_value: info.storeName || "Dubai Abaya" },
        { key_name: "whatsapp", key_value: info.whatsapp || "" },
        { key_name: "instagram", key_value: info.instagram || "" },
        { key_name: "email", key_value: info.email || "" },
        { key_name: "address", key_value: info.address || "" },
        { key_name: "hours", key_value: info.hours || "" },
        { key_name: "about", key_value: info.about || "" },
        { key_name: "logo", key_value: branding.logo || "" },
        { key_name: "logoMark", key_value: branding.mark || "" },
        { key_name: "wallets", key_value: JSON.stringify(info.wallets || []) },
      ];

      for (const s of settingsToSave) {
        await supabase.from("system_settings").upsert(s, { onConflict: "key_name" });
      }

      // 2. Save Banks
      // Fetch current bank IDs from DB to detect deletions
      const { data: currentDbBanks } = await supabase.from("bank_accounts").select("id");
      const currentDbIds = (currentDbBanks || []).map((b: any) => b.id);
      const activeIds = info.banks.filter((b) => b.id.length > 20).map((b) => b.id);

      // Delete banks that were removed from the UI list
      const toDelete = currentDbIds.filter((id: string) => !activeIds.includes(id));
      for (const delId of toDelete) {
        await supabase.from("bank_accounts").delete().eq("id", delId);
      }

      // Insert new or update existing banks
      for (const b of info.banks) {
        if (!b.bank.trim() && !b.iban.trim()) continue; // skip empty rows
        if (b.id.length < 20) {
          // New local bank entry
          await supabase.from("bank_accounts").insert([
            {
              bank_name: b.bank || "بنك",
              account_holder: b.holder || info.storeName,
              iban: b.iban || "",
              account_number: b.iban || "",
              logo_url: b.logo || "",
              is_active: true,
            },
          ]);
        } else {
          // Existing bank entry
          await supabase
            .from("bank_accounts")
            .update({
              bank_name: b.bank || "بنك",
              account_holder: b.holder || info.storeName,
              iban: b.iban || "",
              account_number: b.iban || "",
              logo_url: b.logo || "",
            })
            .eq("id", b.id);
        }
      }

      toast.success("تم حفظ جميع الإعدادات وقنوات التواصل والحسابات بنجاح!");
      await refreshData();
    } catch (e: any) {
      console.error(e);
      toast.error("حدث خطأ أثناء الحفظ: " + (e?.message || ""));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBank = async (id: string) => {
    if (id.length > 20) {
      try {
        await supabase.from("bank_accounts").delete().eq("id", id);
      } catch (e) {
        console.error("Failed to delete from DB directly:", e);
      }
    }
    setInfo({ banks: info.banks.filter((x) => x.id !== id) });
    toast.success("تم حذف الحساب البنكي من القائمة");
  };

  return (
    <div className="flex flex-col gap-6 relative pb-28">
      {/* Brand Identity */}
      <AdminCard title="الهوية والشعارات">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-3xl bg-background/80 p-5 border border-border">
            <p className="text-sm font-bold text-foreground">الشعار الأساسي (Logo)</p>
            <div className="flex items-center gap-4">
              <div className="h-16 flex-1 rounded-2xl bg-muted/60 border border-border/50 overflow-hidden flex items-center justify-center p-2">
                {branding.logo ? (
                  <img src={branding.logo} className="h-full object-contain" />
                ) : (
                  <p className="text-xs text-muted-foreground">بدون شعار</p>
                )}
              </div>
              <label className="tap-pulse flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold hover:border-primary/50">
                رفع
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      uploadImageFile(f, async (url) => {
                        setBranding({ logo: url });
                        await supabase
                          .from("system_settings")
                          .upsert({ key_name: "logo", key_value: url }, { onConflict: "key_name" });
                        toast.success("تم حفظ الشعار في قاعدة البيانات بنجاح");
                        await refreshData();
                      });
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl bg-background/80 p-5 border border-border">
            <p className="text-sm font-bold text-foreground">أيقونة الموقع (Logo Mark)</p>
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-2xl bg-muted/60 border border-border/50 overflow-hidden flex items-center justify-center">
                {branding.mark ? (
                  <img src={branding.mark} className="w-full h-full object-cover" />
                ) : (
                  <p className="text-xs text-muted-foreground">بدون أيقونة</p>
                )}
              </div>
              <label className="tap-pulse flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold hover:border-primary/50">
                رفع
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      uploadImageFile(f, async (url) => {
                        setBranding({ mark: url });
                        await supabase
                          .from("system_settings")
                          .upsert({ key_name: "logoMark", key_value: url }, { onConflict: "key_name" });
                        toast.success("تم حفظ أيقونة الشعار في قاعدة البيانات بنجاح");
                        await refreshData();
                      });
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </AdminCard>

      {/* Store Info & Contacts */}
      <AdminCard title="معلومات المتجر والتواصل">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="اسم المتجر" value={info.storeName} onChange={(v) => setInfo({ storeName: v })} />
          <Field
            label="رقم واتساب (بصيغة دولية، مثال: 967776567738)"
            dir="ltr"
            value={info.whatsapp}
            onChange={(v) => setInfo({ whatsapp: v })}
          />
          <Field
            label="حساب إنستغرام (بدون @)"
            dir="ltr"
            value={info.instagram}
            onChange={(v) => setInfo({ instagram: v })}
          />
          <Field label="البريد الإلكتروني" dir="ltr" value={info.email} onChange={(v) => setInfo({ email: v })} />
          <Field label="العنوان / المدينة" value={info.address} onChange={(v) => setInfo({ address: v })} />
          <Field label="ساعات العمل" value={info.hours} onChange={(v) => setInfo({ hours: v })} />
          <div className="sm:col-span-2">
            <Field label="نبذة من نحن / قصة المتجر" area value={info.about} onChange={(v) => setInfo({ about: v })} />
          </div>
        </div>
      </AdminCard>

      {/* Electronic Wallets */}
      <AdminCard
        title="المحافظ الإلكترونية"
        action={
          <AdminButton
            onClick={() =>
              setInfo({
                wallets: [
                  ...(info.wallets || []),
                  { id: uid(), name: "محفظة جديدة (مثال: جوالي)", number: "" },
                ],
              })
            }
          >
            <span className="flex items-center gap-1.5">
              <Plus className="size-3.5" /> إضافة محفظة
            </span>
          </AdminButton>
        }
      >
        {(!info.wallets || info.wallets.length === 0) ? (
          <div className="rounded-3xl border border-dashed border-border/80 p-8 text-center text-muted-foreground">
            <Wallet className="size-8 mx-auto mb-2 text-primary/60" />
            <p className="text-xs">لم يتم إضافة محافظ إلكترونية بعد (مثل جوالي، الكريمي، كاش، ون كاش).</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {info.wallets.map((w: WalletAccount) => (
              <div key={w.id} className="rounded-3xl bg-background/80 p-5 border border-border/70 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <p className="text-sm font-bold text-foreground">{w.name || "محفظة"}</p>
                  <AdminButton
                    tone="danger"
                    onClick={() => setInfo({ wallets: info.wallets.filter((x) => x.id !== w.id) })}
                  >
                    <Trash2 className="size-3.5" />
                  </AdminButton>
                </div>
                <div className="mt-4 grid gap-3">
                  <Field
                    label="اسم المحفظة (مثال: جوالي / ون كاش / كاش)"
                    value={w.name}
                    onChange={(v) =>
                      setInfo({
                        wallets: info.wallets.map((x) => (x.id === w.id ? { ...x, name: v } : x)),
                      })
                    }
                  />
                  <Field
                    label="رقم الإيداع أو الحساب"
                    dir="ltr"
                    value={w.number}
                    onChange={(v) =>
                      setInfo({
                        wallets: info.wallets.map((x) => (x.id === w.id ? { ...x, number: v } : x)),
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {/* Bank Accounts */}
      <AdminCard
        title="الحسابات البنكية"
        action={
          <AdminButton
            onClick={() =>
              setInfo({
                banks: [
                  ...info.banks,
                  { id: uid(), bank: "بنك جديد", holder: info.storeName || "صاحب الحساب", iban: "", logo: "" },
                ],
              })
            }
          >
            <span className="flex items-center gap-1.5">
              <Plus className="size-3.5" /> إضافة بنك
            </span>
          </AdminButton>
        }
      >
        {info.banks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/80 p-8 text-center text-muted-foreground">
            <Building2 className="size-8 mx-auto mb-2 text-primary/60" />
            <p className="text-xs">لم يتم إضافة حسابات بنكية بعد.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {info.banks.map((b: BankAccount) => (
              <div key={b.id} className="rounded-3xl bg-background/80 p-5 border border-border/70 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <p className="text-sm font-bold text-foreground">{b.bank || "بنك"}</p>
                  <AdminButton tone="danger" onClick={() => deleteBank(b.id)}>
                    <Trash2 className="size-3.5" />
                  </AdminButton>
                </div>
                <div className="mt-4 flex gap-4 items-center">
                  <div className="size-12 rounded-2xl bg-muted/60 overflow-hidden flex items-center justify-center border border-border/50">
                    {b.logo ? (
                      <img src={b.logo} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">شعار</span>
                    )}
                  </div>
                  <label className="tap-pulse flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-bold hover:border-primary/50">
                    رفع شعار البنك
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f)
                          uploadImageFile(f, (url) =>
                            setInfo({
                              banks: info.banks.map((x) => (x.id === b.id ? { ...x, logo: url } : x)),
                            })
                          );
                      }}
                    />
                  </label>
                </div>
                <div className="mt-4 grid gap-3">
                  <Field
                    label="اسم البنك"
                    value={b.bank}
                    onChange={(v) =>
                      setInfo({ banks: info.banks.map((x) => (x.id === b.id ? { ...x, bank: v } : x)) })
                    }
                  />
                  <Field
                    label="اسم صاحب الحساب"
                    value={b.holder}
                    onChange={(v) =>
                      setInfo({ banks: info.banks.map((x) => (x.id === b.id ? { ...x, holder: v } : x)) })
                    }
                  />
                  <Field
                    label="رقم الحساب أو الآيبان (IBAN)"
                    dir="ltr"
                    value={b.iban}
                    onChange={(v) =>
                      setInfo({ banks: info.banks.map((x) => (x.id === b.id ? { ...x, iban: v } : x)) })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {/* Floating Save Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-lg border-t border-border z-30 lg:pr-72 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-4 text-primary" />
          <span>يتم حفظ جميع التعديلات في قاعدة بيانات Supabase وتحديث المتجر في الوقت الفعلي.</span>
        </div>
        <button
          onClick={saveToDb}
          disabled={isSaving}
          className="tap-pulse flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full text-sm font-bold shadow-soft hover:bg-primary/90 transition disabled:opacity-50"
        >
          <Save className="size-4" />
          {isSaving ? "جاري الحفظ..." : "حفظ جميع الإعدادات"}
        </button>
      </div>
    </div>
  );
}
