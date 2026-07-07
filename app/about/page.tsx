import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Sparkles, Tag, Zap, MessageCircle } from "lucide-react";
import { Footer } from "../components/Footer";

const HIGHLIGHTS = [
  {
    icon: Tag,
    title: "Real Brands, Real Prices",
    text: "Rhode, Fenty, e.l.f., Rare Beauty, Maybelline and more — no markup madness.",
  },
  {
    icon: Zap,
    title: "Fast, Easy Checkout",
    text: "Order in seconds. Pay cash on delivery, no account needed.",
  },
  {
    icon: MessageCircle,
    title: "Real People, Real Talk",
    text: "Message us on WhatsApp and get a real reply — not a bot.",
  },
];

export const metadata = {
  title: "About Us — Glam4Less",
  description: "The story behind Glam4Less.",
};

export default function AboutPage() {
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
          <div className="rounded-2xl overflow-hidden mb-8 bg-secondary">
            <Image
              src="/about-hero-3.jpg"
              alt="Glam4Less products"
              width={1376}
              height={768}
              className="w-full h-auto object-cover"
              priority
            />
          </div>

          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span
              className="text-xl font-bold text-primary tracking-wide"
              style={{ fontFamily: "var(--font-display-family)" }}
            >
              Glam4Less
            </span>
          </div>

          <h1
            className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight"
            style={{ fontFamily: "var(--font-display-family)" }}
          >
            Look Glam.
            <br />
            Spend Less.
          </h1>

          <p className="text-muted-foreground mb-10">
            Your favorite makeup, at unbeatable prices. That&apos;s it — that&apos;s
            the whole idea. ✨
          </p>

          <div className="grid gap-5 sm:grid-cols-3">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-secondary rounded-2xl p-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Icon size={17} className="text-primary" />
                </div>
                <h2 className="font-semibold text-foreground text-sm mb-1">{title}</h2>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
