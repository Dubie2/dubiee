import { AnimatePresence, motion } from "framer-motion";
import { Gift, Loader2, Plus, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";

import { pad, useCountdown } from "@/lib/lottery";
import { useStore } from "@/lib/store";

const codes = ["+971", "+966", "+967", "+965", "+974", "+973", "+968", "+20"];

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        dur: 1.6 + Math.random() * 1.2,
        size: 5 + Math.random() * 7,
        hue: ["#B19CD9", "#8A65D4", "#F4F0FA", "#E9C877"][i % 4],
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bits.map((b) => (
        <motion.span
          key={b.id}
          initial={{ y: -20, opacity: 0, rotate: 0 }}
          animate={{ y: 320, opacity: [0, 1, 1, 0], rotate: 360 }}
          transition={{ duration: b.dur, delay: b.delay, repeat: Infinity }}
          style={{
            left: `${b.x}%`,
            width: b.size,
            height: b.size,
            background: b.hue,
          }}
          className="absolute top-0 rounded-[2px]"
        />
      ))}
    </div>
  );
}

function Countdown({ compact = false }: { compact?: boolean }) {
  const { left } = useCountdown();
  const cells = [
    { v: left.days, l: "أيام" },
    { v: left.hours, l: "ساعات" },
    { v: left.minutes, l: "دقائق" },
    { v: left.seconds, l: "ثواني" },
  ];
  return (
    <div className={`grid grid-cols-4 gap-2 ${compact ? "" : "mt-4"}`}>
      {cells.map((c) => (
        <div
          key={c.l}
          className="glass rounded-2xl px-2 py-3 text-center"
          style={{ perspective: 400 }}
        >
          <p className="font-display text-xl font-extrabold text-gradient">{pad(c.v)}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{c.l}</p>
        </div>
      ))}
    </div>
  );
}

export { Countdown as LotteryCountdown };

export function LotteryEntry() {
  const { state, addTickets } = useStore();
  const [open, setOpen] = useState(false);
  const [chips, setChips] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [dial, setDial] = useState("+971");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const locked = state.lottery.locked;

  const addChip = () => {
    const v = code.trim().toUpperCase();
    if (!v) return;
    if (chips.includes(v)) {
      setError("هذا الكود مضاف بالفعل.");
      return;
    }
    setChips((c) => [...c, v]);
    setCode("");
    setError("");
  };

  const submit = async () => {
    const all = code.trim() ? [...chips, code.trim().toUpperCase()] : chips;
    if (!all.length) return setError("أضيفي كود واحد على الأقل.");
    if (!name.trim()) return setError("الاسم الكامل مطلوب.");
    if (phone.replace(/\D/g, "").length < 7) return setError("رقم واتساب غير صحيح.");
    setError("");
    setLoading(true);
    
    const res = await addTickets(all, name.trim(), `${dial}${phone.replace(/\D/g, "")}`);
    setLoading(false);
    
    if (res.added === 0) {
      const reason = res.failed?.[0]?.reason || "الكود غير متاح أو مستخدم مسبقاً";
      setError(`${reason}: ${res.duplicates.join("، ")}`);
      return;
    }
    setResult(res.total);
    setChips([]);
    setCode("");
  };

  const close = () => {
    setOpen(false);
    setResult(null);
    setError("");
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        animate={{ boxShadow: ["0 0 0 0 rgba(177,156,217,0.45)", "0 0 0 16px rgba(177,156,217,0)"] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="glass-strong fixed bottom-5 left-4 z-40 flex max-w-[85vw] items-center gap-2.5 rounded-full py-3 pr-4 pl-3 text-right"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Gift className="size-4" />
        </span>
        <span className="font-display text-[11px] leading-tight font-bold sm:text-xs">
          معاك كرت السحب؟ اضغط هنا
          <br />
          وادخل السحب الأسبوعي 🎁
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-3 backdrop-blur-sm sm:items-center"
            onClick={close}
          >
            <motion.div
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 40, rotateX: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="glass-strong relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-4xl p-6"
            >
              {result !== null && <Confetti />}
              <button
                onClick={close}
                className="tap-pulse absolute top-4 left-4 rounded-full bg-secondary p-2"
              >
                <X className="size-4" />
              </button>

              {result === null ? (
                <>
                  <h2 className="font-display text-lg font-extrabold">
                    سجّلي كرتك وادخلي السحب الأسبوعي 🌷
                  </h2>
                  {locked && (
                    <p className="mt-3 rounded-2xl bg-destructive/10 px-4 py-3 text-xs text-destructive">
                      تم إغلاق التسجيل لهذه الجولة، انتظرينا في الجولة القادمة.
                    </p>
                  )}

                  <div className="mt-5 flex flex-col gap-4">
                    <label className="block">
                      <span className="text-xs text-muted-foreground">
                        أدخلي رمز الكود الخاص بك
                      </span>
                      <div className="mt-1.5 flex gap-2">
                        <input
                          value={code}
                          disabled={locked}
                          onChange={(e) => setCode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === "Enter" && addChip()}
                          placeholder="DA-XXXX"
                          className="flex-1 rounded-2xl bg-background/80 px-4 py-3 text-sm tracking-widest outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button
                          onClick={addChip}
                          disabled={locked}
                          className="tap-pulse flex items-center gap-1 rounded-2xl bg-secondary px-4 text-xs font-bold"
                        >
                          <Plus className="size-3.5" /> إضافة كود آخر
                        </button>
                      </div>
                    </label>

                    {chips.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {chips.map((c) => (
                          <motion.span
                            key={c}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1.5 text-xs font-bold text-primary"
                          >
                            {c}
                            <button onClick={() => setChips((s) => s.filter((x) => x !== c))}>
                              <X className="size-3" />
                            </button>
                          </motion.span>
                        ))}
                      </div>
                    )}

                    <label className="block">
                      <span className="text-xs text-muted-foreground">الاسم الكامل</span>
                      <input
                        value={name}
                        disabled={locked}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1.5 w-full rounded-2xl bg-background/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs text-muted-foreground">رقم الواتساب</span>
                      <div className="mt-1.5 flex gap-2">
                        <select
                          value={dial}
                          onChange={(e) => setDial(e.target.value)}
                          dir="ltr"
                          className="rounded-2xl bg-background/80 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                        >
                          {codes.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <input
                          value={phone}
                          disabled={locked}
                          dir="ltr"
                          inputMode="numeric"
                          onChange={(e) => setPhone(e.target.value)}
                          className="flex-1 rounded-2xl bg-background/80 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </label>

                    {error && <p className="text-xs font-semibold text-destructive">{error}</p>}

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={submit}
                      disabled={locked || loading}
                      className="tap-pulse flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      تأكيد والدخول للسحب
                    </motion.button>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        الوقت المتبقي للسحب القادم
                      </p>
                      <Countdown />
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative py-4 text-center">
                  <Sparkles className="mx-auto size-8 text-primary" />
                  <h2 className="font-display mt-3 text-lg font-extrabold">
                    تم تسجيل كروتك بنجاح!
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    رصيدك الإجمالي:{" "}
                    <span className="font-display text-base font-extrabold text-gradient">
                      {result} كرت
                    </span>
                  </p>
                  <p className="mt-5 text-xs text-muted-foreground">
                    الوقت المتبقي للسحب القادم
                  </p>
                  <Countdown />
                  <button
                    onClick={() => setResult(null)}
                    className="tap-pulse mt-5 rounded-full bg-secondary px-6 py-3 text-xs font-bold"
                  >
                    تسجيل كروت أخرى
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
