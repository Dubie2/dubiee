import { Link, useNavigate } from "@tanstack/react-router";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useRef, useState, useEffect } from "react";

import { formatAED, useStore, type Product } from "@/lib/store";

export type { Product };

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [added, setAdded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { addToCart, setIsCartOpen } = useStore();
  const navigate = useNavigate();

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const rx = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, oklch(1 0 0 / 0.55), transparent 55%)`;

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 16);
    rx.set((0.5 - py) * 16);
    gx.set(px * 100);
    gy.set(py * 100);
  };

  const reset = () => {
    rx.set(0);
    ry.set(0);
    gx.set(50);
    gy.set(50);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1200 }}
      className="group"
    >
      <motion.div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={reset}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="glass relative overflow-hidden rounded-2xl sm:rounded-3xl p-1.5 sm:p-3 transition-shadow duration-500 hover:shadow-deep"
      >
        <Link 
          to="/products/$id" 
          params={{ id: product.id }}
          className="block w-full h-full cursor-pointer"
        >
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-secondary">
            <div className="relative flex h-[14rem] sm:h-[23rem] w-full overflow-hidden bg-secondary">
              <motion.img
                src={product.image}
                alt={product.name}
                width={800}
                height={1100}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                style={{ transform: "translateZ(30px)" }}
              />
            </div>
            
            <motion.div
              style={{ backgroundImage: glare }}
              className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-100"
            />
            <span className="glass-strong absolute top-2 right-2 sm:top-3 sm:right-3 rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[0.6rem] sm:text-[0.68rem] font-medium tracking-wide text-accent-foreground z-10">
              {product.tag}
            </span>

            {/* Wishlist Heart */}
            <button
              type="button"
              onClick={toggleFavorite}
              className={`absolute top-2 left-2 sm:top-3 sm:left-3 z-10 grid size-7 sm:size-8 place-items-center rounded-full bg-background/80 backdrop-blur-md transition-all hover:bg-background ${
                isFavorite ? "text-destructive fill-destructive" : "text-foreground"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </button>

            {/* Fabric Badge */}
            {product.fabric && (
              <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-10 rounded-full bg-background/80 backdrop-blur-md px-2 py-0.5 sm:px-3 sm:py-1 text-[0.6rem] sm:text-[0.68rem] font-bold text-foreground">
                {product.fabric} &gt;
              </div>
            )}

            <div className="absolute inset-x-3 bottom-3 translate-y-4 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart(product.id, product.sizes[0] ?? "M", product.colors?.[0] ?? product.color, 1);
                  setAdded(true);
                  setIsCartOpen(true);
                }}
                className="tap-pulse glass-strong flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl py-2 sm:py-3 text-[0.7rem] sm:text-sm font-semibold text-accent-foreground"
              >
                <ShoppingBag className="size-3.5 sm:size-4" />
                {added ? "تمت الإضافة ✦" : "إضافة للسلة"}
              </button>
            </div>
          </div>

          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-1.5 pt-3 pb-1 sm:px-2 sm:pt-4 sm:pb-2 gap-1 sm:gap-0"
            style={{ transform: "translateZ(24px)" }}
          >
            <div>
              <h3 className="font-display text-[0.8rem] leading-tight sm:text-base font-bold">{product.name}</h3>
              <p className="text-[0.65rem] sm:text-xs text-muted-foreground">{product.fabric ? `${product.fabric} · تفصيل دبي` : 'تفصيل دبي'}</p>
            </div>
            <div className="text-right sm:text-left">
              {product.oldPrice ? (
                <p className="text-[0.6rem] sm:text-[0.68rem] text-muted-foreground line-through">
                  {formatAED(product.oldPrice)}
                </p>
              ) : null}
              <p className="font-display text-sm sm:text-lg font-extrabold text-gradient">
                {formatAED(product.price)}
              </p>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.article>
  );
}
