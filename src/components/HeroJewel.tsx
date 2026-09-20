import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useState } from "react";

import { useStore } from "@/lib/store";

export function HeroJewel() {
  const { state } = useStore();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const logoSrc = state.branding.mark || state.branding.logo;

  return (
    <div
      className="relative aspect-square w-full max-w-[420px]"
      style={{ perspective: 1000 }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setTilt({
          x: ((e.clientY - r.top) / r.height - 0.5) * -12,
          y: ((e.clientX - r.left) / r.width - 0.5) * 12,
        });
      }}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <div className="absolute inset-10 rounded-full bg-primary-glow/40 blur-3xl" />

      {logoSrc ? (
        <motion.img
          src={logoSrc}
          alt={state.info.storeName || "شعار المتجر"}
          width={1024}
          height={1024}
          animate={{ y: [-4, 4, -4], rotateX: tilt.x, rotateY: tilt.y }}
          transition={{
            y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            rotateX: { type: "spring", stiffness: 100, damping: 20 },
            rotateY: { type: "spring", stiffness: 100, damping: 20 },
          }}
          style={{ transformStyle: "preserve-3d" }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[90%] w-[90%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_12px_24px_oklch(0.6_0.12_300_/_0.2)]"
        />
      ) : (
        <motion.div
          animate={{ y: [-4, 4, -4], rotateX: tilt.x, rotateY: tilt.y }}
          transition={{
            y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            rotateX: { type: "spring", stiffness: 100, damping: 20 },
            rotateY: { type: "spring", stiffness: 100, damping: 20 },
          }}
          style={{ transformStyle: "preserve-3d" }}
          className="absolute left-1/2 top-1/2 flex size-64 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-primary/30 bg-primary/10 backdrop-blur-xl shadow-2xl"
        >
          <div className="grid size-20 place-items-center rounded-3xl bg-primary text-primary-foreground shadow-soft">
            <Sparkles className="size-10" />
          </div>
          <span className="font-display mt-4 text-center text-xl font-black text-foreground">
            {state.info.storeName || "Dubai Abaya"}
          </span>
          <span className="text-[10px] tracking-widest text-primary font-bold mt-1">HAUTE COUTURE</span>
        </motion.div>
      )}
    </div>
  );
}
