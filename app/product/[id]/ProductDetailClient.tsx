"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { ProductDetail, type Product } from "../../components/product";
import { Footer } from "../../components/Footer";
import { useCart } from "../../context/CartContext";

export default function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart, totalItems } = useCart();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:px-6 lg:px-10 h-16">
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/icon.png" alt="Glam4Less" className="w-7 h-7 rounded-full" />
          <span
            className="text-xl font-bold text-primary tracking-wide"
            style={{ fontFamily: "var(--font-display-family)" }}
          >
            Glam4Less
          </span>
        </Link>

        <Link
          href="/"
          className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors"
        >
          <ShoppingBag size={18} className="text-foreground" />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground rounded-full text-[9px] font-bold flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Link>
      </header>

      <div className="flex-1">
        <ProductDetail
          product={product}
          onBack={() => router.push("/")}
          onAddToCart={addToCart}
        />
      </div>

      <Footer />
    </div>
  );
}
