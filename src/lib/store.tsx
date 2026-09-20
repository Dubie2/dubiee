import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "./supabase";

export type Category = {
  id: string;
  name: string;
  description: string;
  image: string;
};

export type Review = {
  id: string;
  name: string;
  text: string;
  rating: number;
  date: number;
};

export type Product = {
  id: string;
  name: string;
  tag: string;
  price: number;
  oldPrice?: number | undefined;
  image: string;
  images?: string[] | undefined;
  categoryId: string;
  description: string;
  stock: number;
  sizes: string[];
  styles: string[];
  fabric?: string | undefined;
  material?: string | undefined;
  color?: string | undefined;
  colors?: string[] | undefined;
  discount?: number | undefined;
  featured?: boolean | undefined;
  hoverImage?: string | undefined;
  reviews?: Review[] | undefined;
  is_available?: boolean | undefined;
};

export type Offer = {
  id: string;
  title: string;
  subtitle: string;
  discount: number;
  code: string;
  productId?: string | undefined;
  image?: string | undefined;
};

export type BankAccount = {
  id: string;
  bank: string;
  holder: string;
  iban: string;
  logo?: string | undefined;
};

export type WalletAccount = {
  id: string;
  name: string;
  number: string;
};

export type SiteInfo = {
  storeName: string;
  whatsapp: string;
  instagram: string;
  email: string;
  address: string;
  hours: string;
  about: string;
  banks: BankAccount[];
  wallets: WalletAccount[];
};

export type Branding = {
  logo: string;
  mark: string;
};

export type CartLine = {
  productId: string;
  size: string;
  color?: string | undefined;
  qty: number;
};

export type LotteryTicket = {
  id: string;
  code: string;
  name: string;
  whatsapp: string;
  createdAt: number;
};

export type LotteryWinner = {
  name: string;
  whatsapp: string;
  cards: number;
};

export type LotteryRound = {
  id: string;
  drawnAt: number;
  totalCards: number;
  topWinner: LotteryWinner | null;
  randomWinner: LotteryWinner | null;
  delivery: "contact" | "delivered";
};

export type LotterySettings = {
  autoSend: boolean;
  apiKey: string;
  phoneNumberId: string;
};

export type LotteryState = {
  tickets: LotteryTicket[];
  rounds: LotteryRound[];
  locked: boolean;
  settings: LotterySettings;
};

type StoreState = {
  categories: Category[];
  products: Product[];
  offers: Offer[];
  info: SiteInfo;
  branding: Branding;
  cart: CartLine[];
  isCartOpen: boolean;
  lottery: LotteryState;
  isLoading: boolean;
  isAdminAuthenticated: boolean;
};

const CACHE_KEY = "dubai_abaya_store_cache_v3";
const ADMIN_AUTH_KEY = "dubai_abaya_admin_auth_v2";

const defaultState: StoreState = {
  categories: [],
  products: [],
  offers: [],
  info: {
    storeName: "Dubai Abaya",
    whatsapp: "",
    instagram: "",
    email: "",
    address: "",
    hours: "",
    about: "",
    banks: [],
    wallets: [],
  },
  branding: { logo: "", mark: "" },
  cart: [],
  isCartOpen: false,
  lottery: {
    tickets: [],
    rounds: [],
    locked: false,
    settings: { autoSend: false, apiKey: "", phoneNumberId: "" },
  },
  isLoading: true,
  isAdminAuthenticated: false,
};

// Safe initial cache loader to avoid losing data on page refresh
function getInitialState(): StoreState {
  if (typeof window === "undefined") return defaultState;
  try {
    const isAuthed = localStorage.getItem(ADMIN_AUTH_KEY) === "true";
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...defaultState,
        ...parsed,
        isLoading: false,
        isAdminAuthenticated: isAuthed,
      };
    }
    return { ...defaultState, isAdminAuthenticated: isAuthed };
  } catch (e) {
    console.error("Failed to load cached store state:", e);
    return defaultState;
  }
}

type StoreContextValue = {
  state: StoreState;
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (val: boolean) => void;
  update: (patch: Partial<StoreState>) => void;
  reset: () => void;
  addToCart: (productId: string, size?: string, color?: string, qty?: number) => void;
  setQty: (productId: string, size: string, color: string | undefined, qty: number) => void;
  removeLine: (productId: string, size: string, color?: string) => void;
  clearCart: () => void;
  cartDetails: { line: CartLine; product: Product; total: number }[];
  cartCount: number;
  cartTotal: number;
  setIsCartOpen: (open: boolean) => void;
  updateLottery: (patch: Partial<LotteryState>) => void;
  addTickets: (
    codes: string[],
    name: string,
    whatsapp: string,
  ) => Promise<{ added: number; duplicates: string[]; failed?: { code: string; reason: string }[]; total: number }>;
  runDraw: () => Promise<void>;
  refreshData: () => Promise<void>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(getInitialState);

  // Function to fetch all data from Supabase and synchronize state and cache
  const refreshData = async () => {
    try {
      // 1. Fetch categories
      const { data: catsData } = await supabase.from("categories").select("*");

      // 2. Fetch products
      const { data: prodsData } = await supabase.from("products").select("*");

      // 3. Fetch system settings
      const { data: settingsData } = await supabase.from("system_settings").select("*");

      // 4. Fetch banks
      const { data: banksData } = await supabase.from("bank_accounts").select("*");

      // 5. Fetch offers
      const { data: offersData } = await supabase.from("offers").select("*");

      // 6. Fetch lottery rounds
      const { data: roundsData } = await supabase
        .from("lottery_rounds")
        .select("*")
        .order("created_at", { ascending: false });

      // 7. Fetch lottery entries for active round
      const activeRound = roundsData?.find((r) => r.status === "active");
      let ticketsData: any[] = [];
      if (activeRound) {
        const { data } = await supabase
          .from("lottery_coupons")
          .select("id, coupon_code, claimed_at, lottery_users!claimed_by_user_id(full_name, phone_number)")
          .eq("round_id", activeRound.id)
          .eq("is_claimed", true);
        ticketsData = data || [];
      }

      // Map categories
      const categories: Category[] = (catsData || []).map((c: any) => ({
        id: c.id,
        name: c.name_ar || "فئة",
        description: c.slug || "",
        image: c.image_url || "",
      }));

      // Map products
      const products: Product[] = (prodsData || []).map((p: any) => ({
        id: p.id,
        name: p.title,
        tag: p.tag || (p.is_featured ? "موصى به" : "جديد"),
        price: p.discount_price || p.price,
        oldPrice: p.discount_price ? p.price : undefined,
        image: p.images?.[0] || "",
        images: p.images || [],
        categoryId: p.category_id,
        description: p.description || "",
        stock: p.stock ?? 10,
        sizes: p.sizes || [],
        styles: [],
        fabric: p.fabric || "",
        color: p.colors?.[0],
        colors: p.colors || [],
        featured: p.is_featured,
        hoverImage: p.images?.[1] || p.images?.[0],
        is_available: p.is_available ?? true,
      }));

      // Map settings & branding
      const info: SiteInfo = { ...defaultState.info };
      const branding: Branding = { ...defaultState.branding };

      settingsData?.forEach((s: any) => {
        if (s.key_name === "logo") branding.logo = s.key_value || "";
        if (s.key_name === "logoMark") branding.mark = s.key_value || "";
        if (s.key_name === "wallets") {
          try {
            info.wallets = typeof s.key_value === "string" ? JSON.parse(s.key_value) : s.key_value || [];
          } catch {
            info.wallets = [];
          }
        } else if (s.key_name in info && s.key_name !== "banks" && s.key_name !== "wallets") {
          (info as any)[s.key_name] = s.key_value ?? "";
        }
      });

      // Map banks
      info.banks = (banksData || []).map((b: any) => ({
        id: b.id,
        bank: b.bank_name,
        holder: b.account_holder,
        iban: b.iban || b.account_number || "",
        logo: b.logo_url || "",
      }));

      // Map offers
      const offers: Offer[] = (offersData || []).map((o: any) => ({
        id: o.id,
        title: o.title,
        subtitle: o.subtitle || "",
        discount: Number(o.discount_percentage) || 0,
        code: o.discount_code,
        productId: o.product_id || undefined,
        image: o.image_url || "",
      }));

      // Map lottery data
      const tickets = ticketsData.map((t: any) => ({
        id: t.id,
        code: t.coupon_code,
        name: t.lottery_users?.full_name || "",
        whatsapp: t.lottery_users?.phone_number || "",
        createdAt: new Date(t.claimed_at).getTime(),
      }));

      const rounds: LotteryRound[] = (roundsData || [])
        .filter((r: any) => r.status === "completed")
        .map((r: any): LotteryRound => ({
          id: r.id,
          drawnAt: new Date(r.actual_draw_at || r.created_at).getTime(),
          totalCards: r.winner_most_coupons?.coupon_count || 0,
          topWinner: r.winner_most_coupons
            ? {
                name: r.winner_most_coupons.name,
                whatsapp: r.winner_most_coupons.phone,
                cards: r.winner_most_coupons.coupon_count,
              }
            : null,
          randomWinner: r.winner_random
            ? {
                name: r.winner_random.name,
                whatsapp: r.winner_random.phone,
                cards: 1,
              }
            : null,
          delivery: "contact",
        }));

      const newStatePatch = {
        categories,
        products,
        offers,
        info,
        branding,
        lottery: {
          tickets,
          rounds,
          locked: !activeRound,
          settings: { autoSend: false, apiKey: "", phoneNumberId: "" },
        },
        isLoading: false,
      };

      setState((s) => {
        const nextState = { ...s, ...newStatePatch };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              categories: nextState.categories,
              products: nextState.products,
              offers: nextState.offers,
              info: nextState.info,
              branding: nextState.branding,
              lottery: nextState.lottery,
            }));
          } catch (e) {
            console.warn("Could not save to localStorage cache:", e);
          }
        }
        return nextState;
      });
    } catch (error) {
      console.error("Error fetching data from Supabase:", error);
      setState((s) => ({ ...s, isLoading: false }));
    }
  };

  // Initial fetch and Realtime Setup
  useEffect(() => {
    refreshData();

    // Setup Supabase Real-time Channel across all pages & tabs
    const channel = supabase
      .channel("store-global-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "system_settings" }, () => refreshData())
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => refreshData())
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => refreshData())
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, () => refreshData())
      .on("postgres_changes", { event: "*", schema: "public", table: "bank_accounts" }, () => refreshData())
      .on("postgres_changes", { event: "*", schema: "public", table: "lottery_rounds" }, () => refreshData())
      .on("postgres_changes", { event: "*", schema: "public", table: "lottery_coupons" }, () => refreshData())
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Realtime synchronized with Supabase database.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const setIsAdminAuthenticated = (val: boolean) => {
    setState((s) => ({ ...s, isAdminAuthenticated: val }));
    if (typeof window !== "undefined") {
      try {
        if (val) {
          localStorage.setItem(ADMIN_AUTH_KEY, "true");
        } else {
          localStorage.removeItem(ADMIN_AUTH_KEY);
        }
      } catch (e) {
        console.error("Failed to update admin auth in localStorage:", e);
      }
    }
  };

  const value = useMemo<StoreContextValue>(() => {
    const update = (patch: Partial<StoreState>) => setState((s) => ({ ...s, ...patch }));

    const cartDetails = state.cart
      .map((line) => {
        const product = state.products.find((p) => p.id === line.productId);
        if (!product) return null;
        return { line, product, total: product.price * line.qty };
      })
      .filter(Boolean) as { line: CartLine; product: Product; total: number }[];

    return {
      state,
      isAdminAuthenticated: state.isAdminAuthenticated,
      setIsAdminAuthenticated,
      update,
      reset: () => setState(defaultState),
      refreshData,
      addToCart: (productId, size = "M", color, qty = 1) =>
        setState((s) => {
          const found = s.cart.find((l) => l.productId === productId && l.size === size && l.color === color);
          const cart = found
            ? s.cart.map((l) => (l === found ? { ...l, qty: l.qty + qty } : l))
            : [...s.cart, { productId, size, color, qty }];
          return { ...s, cart };
        }),
      setQty: (productId, size, color, qty) =>
        setState((s) => ({
          ...s,
          cart: s.cart
            .map((l) => (l.productId === productId && l.size === size && l.color === color ? { ...l, qty } : l))
            .filter((l) => l.qty > 0),
        })),
      removeLine: (productId, size, color) =>
        setState((s) => ({
          ...s,
          cart: s.cart.filter((l) => !(l.productId === productId && l.size === size && l.color === color)),
        })),
      clearCart: () => setState((s) => ({ ...s, cart: [] })),
      cartDetails,
      cartCount: cartDetails.reduce((n, d) => n + d.line.qty, 0),
      cartTotal: cartDetails.reduce((n, d) => n + d.total, 0),
      setIsCartOpen: (open) => setState((s) => ({ ...s, isCartOpen: open })),
      updateLottery: (patch) => setState((s) => ({ ...s, lottery: { ...s.lottery, ...patch } })),

      // Async Supabase mutations for Lottery
      addTickets: async (codes, name, whatsapp) => {
        let addedCount = 0;
        let lastTotal = 0;
        const failed: { code: string; reason: string }[] = [];

        for (const code of codes) {
          const trimmed = code.trim().toUpperCase();
          if (!trimmed) continue;

          const { data, error } = await supabase.rpc("claim_lottery_coupon", {
            p_coupon_code: trimmed,
            p_user_name: name.trim(),
            p_phone: whatsapp.trim(),
          });

          if (!error && data?.success) {
            addedCount++;
            lastTotal = data.total_coupons;
          } else {
            failed.push({
              code: trimmed,
              reason: data?.message || error?.message || "الكود غير متاح أو مستخدم مسبقاً",
            });
          }
        }

        // Immediately refresh state
        await refreshData();

        return {
          added: addedCount,
          duplicates: failed.map((f) => f.code),
          failed,
          total: lastTotal,
        };
      },
      runDraw: async () => {
        const { data: activeRounds } = await supabase
          .from("lottery_rounds")
          .select("id")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1);

        const activeRound = activeRounds?.[0];
        if (!activeRound) return;

        const { error } = await supabase.rpc("execute_lottery_draw_v2", {
          p_round_id: activeRound.id,
        });

        if (error) {
          console.error("Error executing draw:", error);
          toast.error("حدث خطأ أثناء تنفيذ السحب: " + error.message);
        } else {
          toast.success("تم تنفيذ السحب وتحديد الفائز بنجاح!");
          await refreshData();
        }
      },
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export const formatAED = (n: number) => `${n.toLocaleString("en-US")} د.إ`;

export function whatsappLink(number: string, text: string) {
  if (!number) return "#";
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export const uid = () => Math.random().toString(36).slice(2, 9);
