import { useEffect, useState } from "react";

/** Next Friday at 4:20 PM (local time). */
export function nextDrawDate(from: Date = new Date()) {
  const d = new Date(from);
  d.setHours(16, 20, 0, 0);
  const daysAhead = (5 - d.getDay() + 7) % 7; // 5 = Friday
  d.setDate(d.getDate() + daysAhead);
  if (d.getTime() <= from.getTime()) d.setDate(d.getDate() + 7);
  return d;
}

export type Countdown = { days: number; hours: number; minutes: number; seconds: number };

export function useCountdown(): { target: Date; left: Countdown; done: boolean } {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = nextDrawDate(new Date(now));
  const diff = Math.max(0, target.getTime() - now);
  const sec = Math.floor(diff / 1000);

  return {
    target,
    done: diff === 0,
    left: {
      days: Math.floor(sec / 86400),
      hours: Math.floor((sec % 86400) / 3600),
      minutes: Math.floor((sec % 3600) / 60),
      seconds: sec % 60,
    },
  };
}

export const pad = (n: number) => String(n).padStart(2, "0");

export function winnerMessage(name: string, kind: "top" | "random") {
  const prize =
    kind === "top"
      ? "الجائزة الأولى - الأكثر تسجيلاً للكروت"
      : "جائزة السحب الأسبوعي العشوائي";
  return `🌸 ألف مبروك من متجر Dubai Abaya! 🌸
مرحباً ${name}،
نبارك لكِ فوزك معنا بـ ${prize} لسحب هذا الأسبوع! 🎁✨
📌 خيارات استلام الجائزة:
1. الاستلام المباشر من خلالنا.
2. طلب إرسال الجائزة بخدمة التوصيل للمنزل (رسوم التوصيل على المستلم).
يرجى الرد لتأكيد طريقة الاستلام المفضلة لديك.`;
}
