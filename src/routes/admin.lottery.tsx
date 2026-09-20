import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Check, Copy, Crown, Dices, Loader2, RefreshCw, Send, Sparkles, Ticket, Trash2, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AdminButton, AdminCard, Field } from "@/components/admin/AdminUI";
import { LotteryCountdown } from "@/components/LotteryEntry";
import { useCountdown, winnerMessage } from "@/lib/lottery";
import { useStore, whatsappLink, type LotteryWinner } from "@/lib/store";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/lottery")({
  component: AdminLottery,
});

const medals = ["🥇", "🥈", "🥉"];

interface CouponRecord {
  id: string;
  coupon_code: string;
  is_claimed: boolean;
  claimed_at: string | null;
  created_at: string;
  lottery_users?: { full_name: string; phone_number: string } | null;
}

function AdminLottery() {
  const { state, updateLottery, runDraw, refreshData } = useStore();
  const { tickets, rounds, locked, settings } = state.lottery;
  const [confirm, setConfirm] = useState(false);
  const { done } = useCountdown();

  useEffect(() => {
    if (done && !locked && tickets.length) runDraw();
  }, [done, locked, tickets.length, runDraw]);

  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unclaimedCount, setUnclaimedCount] = useState(0);
  const [claimedCount, setClaimedCount] = useState(0);
  const [filter, setFilter] = useState<"unclaimed" | "claimed" | "all">("unclaimed");
  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [customCount, setCustomCount] = useState("20");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadCoupons = async () => {
    try {
      const [{ count: total }, { count: unclaimed }, { count: claimed }] = await Promise.all([
        supabase.from('lottery_coupons').select('*', { count: 'exact', head: true }),
        supabase.from('lottery_coupons').select('*', { count: 'exact', head: true }).eq('is_claimed', false),
        supabase.from('lottery_coupons').select('*', { count: 'exact', head: true }).eq('is_claimed', true),
      ]);

      setTotalCount(total || 0);
      setUnclaimedCount(unclaimed || 0);
      setClaimedCount(claimed || 0);

      let query = supabase
        .from('lottery_coupons')
        .select('id, coupon_code, is_claimed, claimed_at, created_at, lottery_users(full_name, phone_number)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter === "unclaimed") {
        query = query.eq('is_claimed', false);
      } else if (filter === "claimed") {
        query = query.eq('is_claimed', true);
      }

      const { data, error } = await query;
      if (!error && data) {
        setCoupons(data as any);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [filter]);

  const handleGenerate = async (count: number) => {
    if (count <= 0 || isNaN(count)) return;
    setIsGenerating(true);
    setFeedback(null);
    try {
      const { data, error } = await supabase.rpc('admin_generate_coupons', { p_count: count });
      if (error) {
        setFeedback({ type: "error", text: `فشل التوليد: ${error.message}` });
      } else {
        setFeedback({ type: "success", text: `تم توليد ${data} كوبون جديد بنجاح وحفظها مباشرة في قاعدة البيانات!` });
        await loadCoupons();
        await refreshData();
      }
    } catch (e: any) {
      setFeedback({ type: "error", text: "حدث خطأ أثناء الاتصال بقاعدة البيانات" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyRandom = () => {
    const unclaimed = coupons.find(c => !c.is_claimed);
    if (unclaimed) {
      handleCopy(unclaimed.coupon_code);
      setFeedback({ type: "success", text: `تم نسخ الكوبون (${unclaimed.coupon_code}) إلى الحافظة! يمكنك استخدامه الآن لتجربة السحب.` });
    } else {
      setFeedback({ type: "error", text: "لا توجد كوبونات غير مستخدمة معروضة حالياً. يمكنك توليد كوبونات جديدة." });
    }
  };

  const handleDeleteUnclaimed = async () => {
    setIsGenerating(true);
    try {
      const { error } = await supabase.from('lottery_coupons').delete().eq('is_claimed', false);
      if (!error) {
        setFeedback({ type: "success", text: "تم مسح الكوبونات غير المستخدمة بنجاح من قاعدة البيانات." });
        await loadCoupons();
      }
    } catch (e) {}
    setIsGenerating(false);
  };

  const leaderboard = useMemo(() => {
    const map = new Map<string, LotteryWinner & { last: number }>();
    for (const t of tickets) {
      const key = t.whatsapp.replace(/\D/g, "");
      const prev = map.get(key);
      if (prev) {
        prev.cards += 1;
        prev.last = Math.max(prev.last, t.createdAt);
      } else {
        map.set(key, { name: t.name, whatsapp: t.whatsapp, cards: 1, last: t.createdAt });
      }
    }
    return [...map.values()].sort((a, b) => b.cards - a.cards);
  }, [tickets]);

  const current = rounds[0];
  const status = locked ? (current ? "مكتمل" : "جاري السحب") : "نشط";

  const kpis = [
    { icon: Ticket, label: "الكروت المسجلة هذا الأسبوع", value: String(tickets.length) },
    { icon: Users, label: "عدد المشتركين", value: String(leaderboard.length) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="glass tap-pulse rounded-3xl p-5">
            <k.icon className="size-4 text-primary" />
            <p className="font-display mt-3 text-2xl font-extrabold">{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
        <div className="glass tap-pulse rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">السحب القادم · الجمعة ٤:٢٠م</p>
            <span className="flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1 text-[10px] font-bold text-primary">
              <span className="size-1.5 animate-ping rounded-full bg-primary" />
              {status}
            </span>
          </div>
          <LotteryCountdown compact />
        </div>
      </div>

      <AdminCard title="إدارة الكوبونات والسحوبات (مربوط بقاعدة البيانات)">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
            <div>
              <p className="text-xs text-muted-foreground">
                يتم توليد وإدارة جميع الكوبونات مباشرة في Supabase بدون أي تخزين محلي (LocalStorage).
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-600 dark:text-emerald-400">
                  كوبونات متاحة: {unclaimedCount}
                </span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                  مسجلة بالسحب: {claimedCount}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
                  الإجمالي: {totalCount}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyRandom}
                className="tap-pulse flex items-center gap-1.5 rounded-xl bg-primary/15 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/25"
                title="نسخ كود كوبون متاح ولصقه في نافذة السحب للتجربة"
              >
                <Sparkles className="size-3.5" /> نسخ كود للتجربة
              </button>
              <button
                type="button"
                onClick={loadCoupons}
                disabled={isGenerating}
                className="tap-pulse flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-bold hover:bg-muted/80"
              >
                <RefreshCw className={`size-3.5 ${isGenerating ? "animate-spin" : ""}`} /> تحديث
              </button>
              {unclaimedCount > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteUnclaimed}
                  disabled={isGenerating}
                  className="tap-pulse flex items-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/20"
                >
                  <Trash2 className="size-3.5" /> مسح غير المستخدم
                </button>
              )}
            </div>
          </div>

          {feedback && (
            <div
              className={`flex items-center justify-between rounded-2xl p-3 text-xs font-bold ${
                feedback.type === "success"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              <span>{feedback.text}</span>
              <button onClick={() => setFeedback(null)} className="p-1">
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* Generator Toolbar */}
          <div className="rounded-2xl bg-background/50 p-4 border border-border/40">
            <p className="text-xs font-bold mb-3">توليد كروت كوبونات جديدة في Supabase:</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => handleGenerate(10)}
                className="tap-pulse flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Ticket className="size-3.5" />}
                +10 كروت
              </button>
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => handleGenerate(50)}
                className="tap-pulse flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Ticket className="size-3.5" />}
                +50 كرت
              </button>
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => handleGenerate(100)}
                className="tap-pulse flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Ticket className="size-3.5" />}
                +100 كرت
              </button>

              <div className="flex items-center gap-1.5 mr-auto">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={customCount}
                  onChange={(e) => setCustomCount(e.target.value)}
                  className="w-20 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-center"
                  placeholder="العدد"
                />
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handleGenerate(Number(customCount))}
                  className="tap-pulse rounded-xl bg-secondary px-3.5 py-1.5 text-xs font-bold disabled:opacity-50"
                >
                  توليد مخصص
                </button>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1 rounded-2xl bg-muted/50 p-1 border border-border/40">
              <button
                type="button"
                onClick={() => setFilter("unclaimed")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                  filter === "unclaimed" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                غير المستخدمة ({unclaimedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter("claimed")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                  filter === "claimed" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                المسجلة بالسحب ({claimedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                  filter === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                الكل ({totalCount})
              </button>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن كود أو اسم أو هاتف..."
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs w-full sm:w-60"
            />
          </div>

          {/* Coupons List */}
          <div className="mt-2">
            {coupons.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                لا توجد كروت متاحة حالياً. اضغط على أزرار التوليد أعلاه لتوليد كروت جديدة وحفظها في قاعدة البيانات.
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-[380px] overflow-y-auto p-1">
                {coupons
                  .filter((c) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.trim().toLowerCase();
                    return (
                      c.coupon_code.toLowerCase().includes(q) ||
                      c.lottery_users?.full_name?.toLowerCase().includes(q) ||
                      c.lottery_users?.phone_number?.includes(q)
                    );
                  })
                  .map((c) => (
                    <div
                      key={c.id}
                      className="group flex items-center justify-between gap-2 rounded-2xl border border-border/70 bg-background/80 p-2.5 transition-all hover:border-primary/50"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black tracking-wider text-foreground select-all">
                            {c.coupon_code}
                          </span>
                          {c.is_claimed ? (
                            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                              مسجّل
                            </span>
                          ) : (
                            <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                              متاح
                            </span>
                          )}
                        </div>
                        {c.is_claimed && c.lottery_users ? (
                          <p className="mt-1 truncate text-[10px] text-muted-foreground">
                            {c.lottery_users.full_name} ({c.lottery_users.phone_number})
                          </p>
                        ) : (
                          <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                            {new Date(c.created_at).toLocaleDateString("ar-AE")}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(c.coupon_code)}
                        className="tap-pulse flex items-center gap-1 rounded-xl bg-muted/60 px-2 py-1 text-[10px] font-bold hover:bg-primary/20 hover:text-primary transition-colors"
                        title="نسخ الكود"
                      >
                        {copiedCode === c.coupon_code ? (
                          <>
                            <Check className="size-3 text-emerald-500" />
                            <span className="text-emerald-600">تم!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </AdminCard>

      <AdminCard title="التشغيل اليدوي للطوارئ">
        <p className="text-xs text-muted-foreground">
          استخدمي هذا الزر فقط إذا لم يُنفّذ السحب تلقائياً في وقته. سيتم تجميد التسجيل وإغلاق
          الجولة فوراً.
        </p>
        <button
          onClick={() => setConfirm(true)}
          className="tap-pulse mt-4 flex items-center gap-2 rounded-full bg-destructive px-6 py-3 text-xs font-bold text-destructive-foreground"
        >
          <AlertTriangle className="size-4" /> تشغيل السحب يدوياً الآن ⚠️
        </button>
        {locked && (
          <button
            onClick={async () => {
              // Close previous active rounds to ensure exactly 1 active round
              await supabase.from('lottery_rounds').update({ status: 'completed' }).eq('status', 'active');
              // Create new active round in Supabase
              const { error } = await supabase.from('lottery_rounds').insert([{
                status: 'active',
                scheduled_draw_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              }]);
              if (!error) {
                await updateLottery({ locked: false }); // optimistic UI
                await refreshData();
              }
            }}
            className="tap-pulse mt-3 block rounded-full bg-secondary px-5 py-2.5 text-xs font-bold"
          >
            بدء جولة جديدة (فتح التسجيل)
          </button>
        )}
      </AdminCard>

      <AdminCard title="جدول المتصدرين اللحظي · الجائزة الأولى">
        {leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد كروت مسجّلة بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">الترتيب</th>
                  <th className="p-3">المشترك</th>
                  <th className="p-3">الواتساب</th>
                  <th className="p-3">الكروت</th>
                  <th className="p-3">آخر كود</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r, i) => (
                  <tr
                    key={r.whatsapp}
                    className={`rounded-2xl ${i === 0 ? "bg-[#E9C877]/20" : "bg-background/70"}`}
                  >
                    <td className="p-3 font-bold">{medals[i] ?? i + 1}</td>
                    <td className="p-3 font-semibold">{r.name}</td>
                    <td className="p-3 text-xs" dir="ltr">
                      {r.whatsapp}
                    </td>
                    <td className="p-3 font-display font-extrabold">{r.cards}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(r.last).toLocaleString("ar-AE")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {current && (
        <AdminCard title="الفائزون · إشعار الواتساب">
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                { w: current.topWinner, kind: "top" as const, title: "الجائزة الأولى", icon: Crown },
                {
                  w: current.randomWinner,
                  kind: "random" as const,
                  title: "السحب العشوائي",
                  icon: Dices,
                },
              ] as const
            ).map(
              ({ w, kind, title, icon: Icon }) =>
                w && (
                  <div key={kind} className="rounded-3xl bg-background/80 p-5">
                    <p className="flex items-center gap-2 text-xs font-bold text-primary">
                      <Icon className="size-4" /> {title}
                    </p>
                    <p className="font-display mt-2 text-lg font-extrabold">{w.name}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {w.whatsapp}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{w.cards} كرت</p>
                    <a
                      href={whatsappLink(w.whatsapp, winnerMessage(w.name, kind))}
                      target="_blank"
                      rel="noreferrer"
                      className="tap-pulse mt-4 flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-bold text-primary-foreground"
                    >
                      <Send className="size-4" /> إرسال إشعار الفوز عبر الواتساب
                    </a>
                  </div>
                ),
            )}
          </div>
        </AdminCard>
      )}

      <AdminCard title="إعدادات WhatsApp Cloud API">
        <label className="flex items-center justify-between rounded-2xl bg-background/80 px-4 py-3 text-sm">
          <span>تفعيل الإرسال التلقائي عبر WhatsApp Cloud API</span>
          <input
            type="checkbox"
            checked={settings.autoSend}
            onChange={(e) =>
              updateLottery({ settings: { ...settings, autoSend: e.target.checked } })
            }
            className="size-5 accent-[oklch(0.72_0.09_300)]"
          />
        </label>
        {settings.autoSend && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="API Key"
              value={settings.apiKey}
              onChange={(v) => updateLottery({ settings: { ...settings, apiKey: v } })}
            />
            <Field
              label="Phone Number ID"
              value={settings.phoneNumberId}
              onChange={(v) => updateLottery({ settings: { ...settings, phoneNumberId: v } })}
            />
          </div>
        )}
      </AdminCard>

      <AdminCard title="أرشيف السحوبات السابقة">
        {rounds.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد سحوبات سابقة.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">تاريخ الجولة</th>
                  <th className="p-3">الفائز الأول</th>
                  <th className="p-3">الفائز العشوائي</th>
                  <th className="p-3">الكروت</th>
                  <th className="p-3">حالة التسليم</th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((r) => (
                  <tr key={r.id} className="bg-background/70">
                    <td className="p-3 text-xs">{new Date(r.drawnAt).toLocaleString("ar-AE")}</td>
                    <td className="p-3">{r.topWinner?.name ?? "—"}</td>
                    <td className="p-3">{r.randomWinner?.name ?? "—"}</td>
                    <td className="p-3">{r.totalCards}</td>
                    <td className="p-3">
                      <select
                        value={r.delivery}
                        onChange={(e) =>
                          updateLottery({
                            rounds: rounds.map((x) =>
                              x.id === r.id
                                ? { ...x, delivery: e.target.value as "contact" | "delivered" }
                                : x,
                            ),
                          })
                        }
                        className="rounded-xl bg-background px-3 py-2 text-xs outline-none"
                      >
                        <option value="contact">قيد التواصل</option>
                        <option value="delivered">تم التسليم</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
          onClick={() => setConfirm(false)}
        >
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative w-full max-w-sm rounded-4xl p-6 text-center"
          >
            <button
              onClick={() => setConfirm(false)}
              className="tap-pulse absolute top-4 left-4 rounded-full bg-secondary p-2"
            >
              <X className="size-4" />
            </button>
            <AlertTriangle className="mx-auto size-7 text-destructive" />
            <p className="font-display mt-3 text-base font-extrabold">
              هل أنت متأكد من تنفيذ السحب يدوياً الآن؟
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              سيتم إغلاق الجولة وتجميد التسجيل الجديد.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <AdminButton
                tone="danger"
                onClick={() => {
                  runDraw();
                  setConfirm(false);
                }}
              >
                نعم، نفّذ السحب
              </AdminButton>
              <AdminButton tone="ghost" onClick={() => setConfirm(false)}>
                إلغاء
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
