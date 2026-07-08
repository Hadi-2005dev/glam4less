import Link from "next/link";
import { ChevronLeft, Truck, Banknote, RotateCcw, MessageCircle } from "lucide-react";
import { Footer, WhatsAppIcon } from "../components/Footer";

export const metadata = {
  title: "Shipping & Returns — Glam4Less",
  description: "Delivery charges, timelines, payment methods, and return policy.",
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border flex items-center gap-4 px-4 md:px-6 lg:px-10 h-16">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} />
          Back to shop
        </Link>
      </header>

      <main className="flex-1 px-4 md:px-6 lg:px-10 py-10 md:py-16">
        <div className="max-w-2xl mx-auto">
          <h1
            className="text-3xl md:text-4xl font-bold text-foreground mb-2 leading-tight"
            style={{ fontFamily: "var(--font-display-family)" }}
          >
            Shipping &amp; Returns
          </h1>
          <p className="text-muted-foreground mb-10">
            We're committed to getting your order to you accurately and on time.
          </p>

          {/* Delivery */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck size={16} className="text-primary" />
              </div>
              <h2 className="font-semibold text-foreground">Delivery Charges &amp; Timelines</h2>
            </div>
            <div className="bg-secondary rounded-2xl p-4 space-y-2 text-sm text-foreground">
              <p>
                ✓ We deliver to most areas in Lebanon starting at <strong>$3</strong> — the
                rate may be higher for locations far from Beirut (we'll confirm the exact fee
                with you via WhatsApp before shipping)
              </p>
              <p>✓ Some areas may currently be unreachable depending on the security situation — we'll let you know if that's the case for your address</p>
              <p>✓ Estimated delivery time: <strong>2–4 business days</strong></p>
              <p>✓ Free delivery on all orders over <strong>$25</strong></p>
            </div>
          </section>

          {/* Payment */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Banknote size={16} className="text-primary" />
              </div>
              <h2 className="font-semibold text-foreground">Payment Methods</h2>
            </div>
            <div className="bg-secondary rounded-2xl p-4 text-sm text-foreground">
              <p>
                <strong>Cash on Delivery (COD)</strong> — available on every order. Pay in cash
                when your package arrives, no online payment needed.
              </p>
            </div>
          </section>

          {/* Returns */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <RotateCcw size={16} className="text-primary" />
              </div>
              <h2 className="font-semibold text-foreground">Returns &amp; Exchanges</h2>
            </div>
            <div className="bg-secondary rounded-2xl p-4 space-y-2 text-sm text-foreground">
              <p>
                For hygiene reasons, opened or used beauty products cannot be returned or
                exchanged.
              </p>
              <p>
                If your order arrives damaged, incorrect, or faulty, message us on WhatsApp
                within <strong>24 hours</strong> of delivery with your order details and a
                photo — we'll sort out a replacement or refund.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle size={16} className="text-primary" />
              </div>
              <h2 className="font-semibold text-foreground">Need Help?</h2>
            </div>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#25D366] text-white rounded-full font-semibold text-sm hover:bg-[#20bc5a] transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4 fill-current" />
              Message us on WhatsApp
            </a>
          </section>

          <p className="text-xs text-muted-foreground mt-10 italic">
            (This is a starting draft — review and adjust these terms to match your actual
            policies in app/shipping/page.tsx.)
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
