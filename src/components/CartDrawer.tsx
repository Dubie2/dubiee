import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect } from "react";

import { formatAED, useStore } from "@/lib/store";

export function CartDrawer() {
  const { state, setIsCartOpen, cartDetails, cartTotal, setQty, removeLine, clearCart } = useStore();
  const isCartOpen = state.isCartOpen;

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen]);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 bottom-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <ShoppingBag className="size-5" /> السلة
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="tap-pulse grid size-8 place-items-center rounded-full bg-secondary text-secondary-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cartDetails.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingBag className="size-10 text-muted-foreground/30" />
                  <p className="mt-4 text-sm text-muted-foreground">سلتك فارغة حالياً.</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="tap-pulse mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"
                  >
                    تصفّحي المجموعة
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {cartDetails.map(({ line, product, total }, i) => (
                    <motion.div
                      key={`${line.productId}-${line.size}-${line.color || 'none'}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-4"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="size-20 rounded-2xl object-cover border border-border/50"
                      />
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="flex justify-between">
                            <h3 className="font-display text-sm font-bold">{product.name}</h3>
                            <button
                              onClick={() => removeLine(line.productId, line.size, line.color)}
                              className="text-destructive/70 hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>القياس {line.size}</span>
                            {line.color && (
                              <>
                                <span>·</span>
                                <span>{line.color}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-gradient">{formatAED(total)}</p>
                          <div className="flex items-center gap-2 rounded-full bg-secondary px-2 py-1">
                            <button
                              aria-label="إنقاص"
                              onClick={() => setQty(line.productId, line.size, line.color, line.qty - 1)}
                              className="tap-pulse p-1"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="w-4 text-center text-xs font-bold">{line.qty}</span>
                            <button
                              aria-label="زيادة"
                              onClick={() => setQty(line.productId, line.size, line.color, line.qty + 1)}
                              className="tap-pulse p-1"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <button
                    onClick={clearCart}
                    className="self-start text-xs text-muted-foreground underline mt-2"
                  >
                    إفراغ السلة
                  </button>
                </div>
              )}
            </div>

            {cartDetails.length > 0 && (
              <div className="border-t border-border/50 bg-background/50 p-6 backdrop-blur-md">
                <div className="flex justify-between font-bold">
                  <span>الإجمالي:</span>
                  <span className="font-display text-lg text-gradient">{formatAED(cartTotal)}</span>
                </div>
                <p className="mt-1 text-[0.65rem] text-muted-foreground">التوصيل يتم حسابه في خطوة الدفع</p>
                <Link
                  to="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="tap-pulse mt-4 flex w-full items-center justify-center rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground"
                >
                  متابعة الدفع
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
