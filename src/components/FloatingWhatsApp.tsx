import { MessageCircle } from "lucide-react";
import { useStore, whatsappLink } from "@/lib/store";

export function FloatingWhatsApp() {
  const { state } = useStore();

  return (
    <a
      href={whatsappLink(state?.info?.whatsapp || "", "مرحباً، لدي استفسار بخصوص المتجر.")}
      target="_blank"
      rel="noreferrer"
      aria-label="تواصل معنا عبر واتساب"
      className="fixed bottom-6 left-6 z-40 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 sm:bottom-10 sm:left-10"
      style={{ boxShadow: "0 10px 25px -5px rgba(37, 211, 102, 0.4)" }}
    >
      <div className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping" />
      <MessageCircle className="relative size-7" />
    </a>
  );
}
