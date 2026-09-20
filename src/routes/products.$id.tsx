import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, ShoppingBag, Minus, Plus, ChevronDown, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useState, useEffect } from "react";

import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { formatAED, useStore, whatsappLink } from "@/lib/store";

export const Route = createFileRoute("/products/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل القطعة · Dubai Abaya" },
      {
        name: "description",
        content: "تفاصيل القطعة، القياسات المتوفرة، السعر، وإمكانية الطلب عبر واتساب.",
      },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { state, addToCart, setIsCartOpen, cartCount } = useStore();
  const product = state.products.find((p) => p.id === id);
  
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("fabric");
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Gallery & Wishlist state
  const [activeImage, setActiveImage] = useState<string>(product?.image ?? "");
  const [isFavorite, setIsFavorite] = useState(false);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  const images = product ? (product.images && product.images.length > 0 ? product.images : [product.image]) : [];
  const currentImageIndex = Math.max(0, images.indexOf(activeImage));

  const showNextImage = () => {
    if (images.length <= 1) return;
    const nextIdx = (currentImageIndex + 1) % images.length;
    const img = images[nextIdx];
    if (img) setActiveImage(img);
  };

  const showPrevImage = () => {
    if (images.length <= 1) return;
    const prevIdx = (currentImageIndex - 1 + images.length) % images.length;
    const img = images[prevIdx];
    if (img) setActiveImage(img);
  };

  useEffect(() => {
    if (product) {
      setActiveImage(product.image);
      setSize(null);
      setColor(product.colors?.[0] ?? product.color ?? null);
      setQty(1);
      setSizeError(false);
    }
  }, [product]);

  const toggleFavorite = () => {
    if (!product) return;
    setIsFavorite(!isFavorite);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.sizes && product.sizes.length > 0 && !size) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addToCart(product.id, size ?? undefined, color ?? undefined, qty);
    setIsCartOpen(true);
  };

  if (!product) {
    return (
      <PageShell title="القطعة غير متوفرة" subtitle="ربما تم حذفها من المجموعة.">
        <div className="text-center">
          <Link
            to="/products"
            className="tap-pulse inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            عودة للمنتجات
          </Link>
        </div>
      </PageShell>
    );
  }

  const similarProducts = state.products
    .filter((p) => p.id !== product.id)
    .map((p) => {
      let score = 0;
      if (p.categoryId === product.categoryId) score += 2;
      const sharedStyles = p.styles?.filter((s) => product.styles?.includes(s)) || [];
      score += sharedStyles.length;
      return { product: p, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product)
    .slice(0, 4);

  return (
    <div dir="rtl" className="relative min-h-screen overflow-x-hidden bg-background">
      <SiteHeader />
      
      <main className="pb-6 pt-16 sm:pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Breadcrumbs */}
          <nav aria-label="breadcrumb" className="mb-8 flex items-center gap-1 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
            <ChevronLeft className="size-4" />
            <Link to="/products" className="hover:text-primary transition-colors">المنتجات</Link>
            <ChevronLeft className="size-4" />
            <span className="truncate text-foreground font-semibold">{product.name}</span>
          </nav>

          {/* Main Grid: Desktop Side-by-Side, Mobile Stacked */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            
            {/* LEFT SIDE (Gallery) */}
            <div className="relative">
              <div className="relative group sm:rounded-4xl overflow-hidden bg-secondary/30">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full aspect-[3/4] sm:aspect-auto sm:h-[700px] cursor-pointer"
                    onClick={() => setIsLightboxOpen(true)}
                  >
                    <img
                      src={activeImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Favorite button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite();
                  }}
                  className="absolute top-4 left-4 z-10 grid size-12 place-items-center rounded-full bg-background/80 backdrop-blur-md text-foreground transition-all hover:bg-background shadow-soft"
                >
                  <Heart className={`size-6 transition-colors ${isFavorite ? "fill-destructive text-destructive" : ""}`} />
                </button>

                {/* Zoom / Lightbox button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  className="absolute bottom-4 left-4 z-10 grid size-10 place-items-center rounded-full bg-background/80 backdrop-blur-md text-foreground transition-all hover:bg-background shadow-soft"
                  title="تكبير واستعراض الصور"
                >
                  <Maximize2 className="size-4" />
                </button>
                
                {product.discount && (
                  <div className="absolute top-4 right-4 z-10 rounded-full bg-destructive px-4 py-1.5 text-sm font-bold text-destructive-foreground shadow-soft">
                    خصم {product.discount}%
                  </div>
                )}

                {/* Navigation Arrows on main image */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showPrevImage();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 grid size-10 place-items-center rounded-full bg-background/85 backdrop-blur-md text-foreground shadow-md transition hover:bg-background hover:scale-105"
                      title="الصورة السابقة"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showNextImage();
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 grid size-10 place-items-center rounded-full bg-background/85 backdrop-blur-md text-foreground shadow-md transition hover:bg-background hover:scale-105"
                      title="الصورة التالية"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <div className="absolute bottom-4 right-4 z-10 rounded-full bg-background/85 backdrop-blur-md px-3 py-1 text-xs font-bold text-foreground shadow-soft">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails list */}
              {images.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:px-0 snap-x hide-scrollbar">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`relative h-24 w-20 shrink-0 snap-start overflow-hidden rounded-xl border-2 transition-all ${
                        activeImage === img ? "border-primary ring-2 ring-primary/30" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`${product.name} - صورة ${idx + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT SIDE (Info) */}
            <div className="px-5 pt-2 sm:pt-0 pb-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-block rounded-full bg-primary/15 text-primary px-3 py-1 text-xs font-bold tracking-wider">
                  {product.tag || "جديد"}
                </span>
                {product.fabric && (
                  <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                    خامة: {product.fabric}
                  </span>
                )}
                {product.stock > 0 ? (
                  <span className="inline-block rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-xs font-bold">
                    متوفر بالمخزون ({product.stock} قطعة)
                  </span>
                ) : (
                  <span className="inline-block rounded-full bg-destructive/10 text-destructive px-3 py-1 text-xs font-bold">
                    نفدت الكمية
                  </span>
                )}
              </div>

              <h1 className="font-display mt-1 text-3xl font-bold sm:text-4xl lg:text-5xl text-foreground">
                {product.name}
              </h1>

              <div className="mt-1 flex items-center gap-4 text-2xl font-extrabold sm:text-3xl">
                <span className="text-gradient">{formatAED(product.price)}</span>
                {product.oldPrice && (
                  <span className="text-lg text-muted-foreground line-through decoration-destructive/50">
                    {formatAED(product.oldPrice)}
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {product.description}
              </p>
              
              <div className="mt-3 border-t border-border/50 pt-2">
                <h3 className="mb-2 font-bold text-foreground flex items-center gap-2">
                  <Heart className="size-4 text-primary" />
                  خيارات وتحديد الطلب
                </h3>

                {/* Colors */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm font-bold text-foreground mb-1">اللون: <span className="text-muted-foreground font-normal">{color}</span></p>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map(c => (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          className={`tap-pulse rounded-full px-5 py-2 text-sm font-semibold transition-colors border ${
                            color === c 
                              ? "bg-foreground text-background border-foreground" 
                              : "bg-background text-foreground border-border hover:border-foreground/30"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-foreground">المقاس:</p>
                      <button onClick={() => setIsSizeGuideOpen(true)} className="text-xs text-primary underline tap-pulse">دليل المقاسات</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => { setSize(s); setSizeError(false); }}
                          className={`tap-pulse min-w-[3.5rem] rounded-xl px-4 py-2.5 text-sm font-bold border transition-colors ${
                            size === s
                              ? "border-primary bg-primary text-primary-foreground"
                              : sizeError 
                                ? "border-destructive text-destructive bg-destructive/5"
                                : "border-border bg-background text-foreground hover:border-primary/50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <AnimatePresence>
                      {sizeError && (
                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-xs text-destructive font-bold">
                          يرجى اختيار المقاس أولاً
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Quantity & Add to Cart */}
                <div className="mb-3 flex flex-col gap-2 mt-2">
                  <label className="text-sm font-medium text-muted-foreground">الكمية المطلوبة</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3 sm:w-32 bg-background shadow-sm">
                      <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2">
                        -
                      </button>
                      <span className="font-extrabold text-lg">{qty}</span>
                      <button onClick={() => setQty(qty + 1)} className="text-muted-foreground hover:text-foreground text-xl font-bold px-2">
                        +
                      </button>
                    </div>
                    
                    <button
                      onClick={handleAddToCart}
                      disabled={product.stock === 0}
                      className="tap-pulse flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-4 text-lg font-bold text-primary-foreground disabled:opacity-50 shadow-soft hover:bg-primary/90 transition-colors"
                    >
                      <ShoppingBag className="size-6" /> {product.stock === 0 ? "نفدت الكمية" : "أضف إلى السلة"}
                    </button>
                  </div>
                </div>

                {cartCount > 0 && (
                  <button onClick={() => setIsCartOpen(true)} className="mb-8 block w-full text-center text-xs text-primary underline">
                    لديك {cartCount} قطعة في السلة، عرض السلة
                  </button>
                )}
                
                {/* Additional Details */}
                <div className="divide-y divide-border/50 border-t border-b border-border/50">
                  {[
                    { id: "fabric", title: "القماش والخامة", content: product.material || product.fabric || "معلومات غير متوفرة" },
                    { id: "care", title: "العناية بالمنتج", content: "يفضل الغسيل الجاف (Dry Clean) أو الغسيل اليدوي بماء بارد وشامبو عبايات مخصص للحفاظ على جودة القماش والتطريز." },
                    { id: "policy", title: "سياسة الاستبدال", content: "الاستبدال متاح خلال 7 أيام من تاريخ الاستلام بشرط عدم استخدام القطعة ووجود جميع المرفقات." }
                  ].map(tab => (
                    <div key={tab.id} className="py-0">
                      <button 
                        onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                        className="flex w-full items-center justify-between py-1.5 text-sm font-bold text-foreground"
                      >
                        {tab.title}
                        <ChevronDown className={`size-4 transition-transform ${activeTab === tab.id ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {activeTab === tab.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{tab.content}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {product.reviews && product.reviews.length > 0 && (
          <div className="mx-auto max-w-7xl px-5 mt-4 sm:mt-6">
            <div className="rounded-4xl bg-secondary/30 p-4 sm:p-6">
              <h2 className="font-display text-xl font-bold mb-2">آراء العملاء</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {product.reviews.map((r) => (
                  <div key={r.id} className="glass rounded-3xl p-6">
                    <div className="flex items-center gap-1 text-amber-400 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className={`size-4 ${i < r.rating ? "fill-current" : "text-border fill-transparent"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm text-foreground/90 font-medium leading-relaxed mb-6">"{r.text}"</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-auto">
                      <span className="font-bold">{r.name}</span>
                      <span dir="ltr">{new Date(r.date).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Related Products */}
        {similarProducts.length > 0 && (
          <div className="mx-auto max-w-7xl px-5 mt-6">
            <motion.header
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-2 text-center sm:text-right"
            >
              <h2 className="font-display text-3xl font-bold">قد يعجبك أيضاً</h2>
              <p className="mt-3 text-sm text-muted-foreground">استكشفي تشكيلة تتماشى مع ذوقك</p>
            </motion.header>
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {similarProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed */}
        {recentlyViewedIds.length > 0 && (
          <div className="mx-auto max-w-7xl px-5 mt-6 border-t border-border/40 pt-4">
            <motion.header
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-2 text-center sm:text-right"
            >
              <h2 className="font-display text-2xl font-bold">شوهدت مؤخراً</h2>
            </motion.header>
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {recentlyViewedIds.map((id, i) => {
                const rp = state.products.find(p => p.id === id);
                return rp ? <ProductCard key={rp.id} product={rp} index={i} /> : null;
              })}
            </div>
          </div>
        )}

        {/* Size Guide Modal */}
        <AnimatePresence>
          {isSizeGuideOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSizeGuideOpen(false)}
                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 p-4 sm:p-0"
              >
                <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
                  <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                    <h2 className="font-display text-lg font-bold">دليل المقاسات</h2>
                    <button
                      onClick={() => setIsSizeGuideOpen(false)}
                      className="tap-pulse grid size-8 place-items-center rounded-full bg-secondary text-secondary-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-right">
                        <thead>
                          <tr className="border-b border-border/50 text-muted-foreground">
                            <th className="pb-3 font-bold">المقاس</th>
                            <th className="pb-3 font-bold">الطول (انش)</th>
                            <th className="pb-3 font-bold">الصدر (انش)</th>
                            <th className="pb-3 font-bold">طول الكم (انش)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { s: "50", l: "50", c: "20", sl: "26" },
                            { s: "52", l: "52", c: "21", sl: "27" },
                            { s: "54", l: "54", c: "22", sl: "28" },
                            { s: "56", l: "56", c: "23", sl: "29" },
                            { s: "58", l: "58", c: "24", sl: "30" },
                            { s: "60", l: "60", c: "25", sl: "31" },
                          ].map((r, i) => (
                            <tr key={r.s} className="border-b border-border/20 last:border-0">
                              <td className="py-3 font-bold">{r.s}</td>
                              <td className="py-3">{r.l}</td>
                              <td className="py-3">{r.c}</td>
                              <td className="py-3">{r.sl}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground bg-secondary/50 p-3 rounded-xl">
                      ملاحظة: جميع القياسات تؤخذ والقطعة مفرودة على سطح مستوٍ. قد يختلف القياس بمقدار بسيط حسب نوع القماش.
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Fullscreen Lightbox Modal for Browsing All Product Images */}
        <AnimatePresence>
          {isLightboxOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-6 left-6 z-50 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm"
                title="إغلاق"
              >
                <X className="size-6" />
              </button>

              <div className="relative flex flex-col items-center justify-center max-w-5xl w-full h-full max-h-[90vh]">
                <div className="relative flex-1 flex items-center justify-center w-full overflow-hidden">
                  <motion.img
                    key={activeImage}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    src={activeImage}
                    alt={product.name}
                    className="max-h-[70vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
                  />

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={showPrevImage}
                        aria-label="الصورة السابقة"
                        className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 grid size-12 place-items-center rounded-full bg-white/15 text-white hover:bg-white/30 backdrop-blur-md transition shadow-lg"
                      >
                        <ChevronRight className="size-6" />
                      </button>
                      <button
                        onClick={showNextImage}
                        aria-label="الصورة التالية"
                        className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 grid size-12 place-items-center rounded-full bg-white/15 text-white hover:bg-white/30 backdrop-blur-md transition shadow-lg"
                      >
                        <ChevronLeft className="size-6" />
                      </button>
                    </>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="mt-4 flex items-center gap-3 overflow-x-auto max-w-full px-4 py-2">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(img)}
                        className={`h-16 w-14 shrink-0 rounded-xl overflow-hidden border-2 transition ${
                          activeImage === img ? "border-primary scale-105" : "border-transparent opacity-50 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt="Thumbnail" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-2 text-center text-xs font-semibold text-white/70">
                  {currentImageIndex + 1} من {images.length}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

      </main>
      <SiteFooter />
    </div>
  );
}
