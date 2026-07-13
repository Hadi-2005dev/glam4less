"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Footer, WhatsAppIcon } from "./components/Footer";
import { HeroCarousel } from "./components/HeroCarousel";
import { MenuDrawer } from "./components/MenuDrawer";
import { useCart } from "./context/CartContext";
import {
  type Product,
  type CartItem,
  DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
  getDeliveryFee,
  isValidLebanesePhone,
  BADGE_COLORS,
  getBadge,
  placeholderBgFor,
  buildWhatsAppMessage,
  StarRating,
  cartItemKey,
  getVariantStock,
  getCartItemImage,
} from "./components/product";
import {
  ShoppingBag,
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  ChevronLeft,
  MapPin,
  Phone,
  User,
  MessageSquare,
  Clock,
  Check,
  Menu,
} from "lucide-react";

const supabase = createClient();

type Page = "catalog" | "cart" | "checkout" | "confirmation";
type Category = "All" | "Lips" | "Eyes" | "Face" | "Skincare" | "Sets" | "Body Mist" | "Perfumes";

const CATEGORIES: Category[] = ["All", "Lips", "Eyes", "Face", "Skincare", "Sets", "Body Mist", "Perfumes"];

// Next.js doesn't restore catalog scroll position when returning from a
// product page (different top-level route = fresh mount), so we save/restore
// it ourselves via sessionStorage around the round trip.
const CATALOG_SCROLL_KEY = "g4l_catalog_scroll";
function saveScrollPosition() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(CATALOG_SCROLL_KEY, String(window.scrollY));
  }
}

function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
}) {
  const [added, setAdded] = useState(false);
  const badge = getBadge(product);
  const placeholderBg = placeholderBgFor(product.id);
  const hasVariants = !!product.variants && product.variants.length > 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border group hover:shadow-md transition-all duration-200">
      <div className={`relative ${placeholderBg} aspect-square overflow-hidden`}>
        <Link href={`/product/${product.id}`} className="absolute inset-0 block" onClick={saveScrollPosition}>
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        {badge && product.stock > 0 && (
          <span
            className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide ${
              BADGE_COLORS[badge] ?? "bg-primary text-primary-foreground"
            }`}
          >
            {badge}
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide bg-muted text-muted-foreground">
            Out of Stock
          </span>
        )}
        {hasVariants ? (
          <Link
            href={`/product/${product.id}`}
            className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
            title="Choose a shade"
            onClick={saveScrollPosition}
          >
            <Plus size={13} />
          </Link>
        ) : (
          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
              product.stock === 0
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : added
                ? "bg-green-500 text-white scale-110"
                : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
            }`}
          >
            {added ? <Check size={13} /> : <Plus size={13} />}
          </button>
        )}
      </div>
      <Link href={`/product/${product.id}`} className="block p-2.5" onClick={saveScrollPosition}>
        <p className="text-[10px] text-muted-foreground mb-0.5">{product.category}</p>
        <h3 className="text-xs font-semibold text-foreground leading-tight line-clamp-2 mb-1.5">
          {product.title}
        </h3>
        <div className="flex items-center gap-1 mb-2">
          <StarRating rating={product.rating} />
          <span className="text-[9px] text-muted-foreground">({product.reviews_count})</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-primary">${product.price.toFixed(2)}</span>
          {product.original_price && (
            <span className="text-[10px] text-muted-foreground line-through">
              ${product.original_price.toFixed(2)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}

function Header({
  totalItems,
  onCartClick,
  onLogoClick,
  search,
  setSearch,
  category,
  setCategory,
  showSearch,
}: {
  totalItems: number;
  onCartClick: () => void;
  onLogoClick: () => void;
  search: string;
  setSearch: (s: string) => void;
  category: Category;
  setCategory: (c: Category) => void;
  showSearch: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop header */}
      <header className="hidden md:flex sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border items-center px-6 lg:px-10 h-16 gap-6 shadow-sm">
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2 shrink-0 group"
        >
          <img src="/icon.png" alt="Glam4Less" className="w-7 h-7 rounded-full" />
          <span
            className="text-xl font-bold text-primary tracking-wide"
            style={{ fontFamily: "var(--font-display-family)" }}
          >
            Glam4Less
          </span>
        </button>

        <nav className="flex items-center gap-1 shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                onLogoClick();
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        <div className="flex-1 max-w-xs ml-auto">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-secondary rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <button
          onClick={onCartClick}
          className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors shrink-0"
        >
          <ShoppingBag size={18} className="text-foreground" />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground rounded-full text-[9px] font-bold flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </header>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setMenuOpen(true)}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-foreground" />
          </button>
          <button onClick={onLogoClick} className="flex items-center gap-1.5">
            <img src="/icon.png" alt="Glam4Less" className="w-6 h-6 rounded-full" />
            <span
              className="text-lg font-bold text-primary tracking-wide"
              style={{ fontFamily: "var(--font-display-family)" }}
            >
              Glam4Less
            </span>
          </button>
          <button
            onClick={onCartClick}
            className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          >
            <ShoppingBag size={18} className="text-foreground" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground rounded-full text-[9px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
        {showSearch && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-secondary rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        )}
      </header>

      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function CatalogPage({
  products,
  category,
  setCategory,
  onAddToCart,
}: {
  products: Product[];
  category: Category;
  setCategory: (c: Category) => void;
  onAddToCart: (p: Product) => void;
}) {
  return (
    <div className="pb-28 md:pb-10">
      {/* Mobile category scroll */}
      <div className="md:hidden px-4 py-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Hero banner */}
      <HeroCarousel />

      {/* Results count */}
      <div className="px-4 md:px-6 lg:px-10 mb-3">
        <p className="text-xs text-muted-foreground">
          {products.length} product{products.length !== 1 ? "s" : ""}
          {category !== "All" ? ` in ${category}` : " across all categories"}
        </p>
      </div>

      {/* Product grid */}
      <div className="px-4 md:px-6 lg:px-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-20">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-muted-foreground font-medium">No products found</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search or category</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CartContent({
  cart,
  updateQuantity,
  removeFromCart,
  onCheckout,
  onContinue,
  totalPrice,
}: {
  cart: CartItem[];
  updateQuantity: (id: string, delta: number, variantName?: string) => void;
  removeFromCart: (id: string, variantName?: string) => void;
  onCheckout: () => void;
  onContinue: () => void;
  totalPrice: number;
}) {
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <ShoppingBag size={28} className="text-muted-foreground/60" />
        </div>
        <h3
          className="text-xl font-bold text-foreground mb-2"
          style={{ fontFamily: "var(--font-display-family)" }}
        >
          Your cart is empty
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Add some gorgeous products to get started!
        </p>
        <button
          onClick={onContinue}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: "none" }}>
        {cart.map((item) => {
          const { product, quantity, variantName } = item;
          const stock = getVariantStock(product, variantName);
          return (
          <div key={cartItemKey(product.id, variantName)} className="flex gap-3 bg-secondary rounded-2xl p-3">
            <div className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 ${placeholderBgFor(product.id)}`}>
              <img
                src={getCartItemImage(item)}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground">
                {product.category}
                {variantName ? ` · ${variantName}` : ""}
              </p>
              <p className="text-sm font-semibold text-foreground leading-tight truncate">
                {product.title}
              </p>
              <p className="text-sm font-bold text-primary mt-0.5">
                ${(product.price * quantity).toFixed(2)}
              </p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 bg-card rounded-full px-1 py-1 shadow-sm">
                  <button
                    onClick={() => updateQuantity(product.id, -1, variantName)}
                    className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="w-5 text-center text-sm font-bold">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, 1, variantName)}
                    disabled={quantity >= stock}
                    className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:hover:bg-secondary"
                  >
                    <Plus size={11} />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(product.id, variantName)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1.5"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      <div className="border-t border-border p-4 bg-card shrink-0">
        {totalPrice < FREE_DELIVERY_THRESHOLD && (
          <p className="text-xs text-primary font-medium mb-3 bg-primary/10 rounded-lg px-3 py-2">
            Add ${(FREE_DELIVERY_THRESHOLD - totalPrice).toFixed(2)} more for free delivery! 🚚
          </p>
        )}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">${totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            {getDeliveryFee(totalPrice) === 0 ? (
              <span className="text-green-600 font-semibold">Free</span>
            ) : (
              <span className="font-medium">${DELIVERY_FEE.toFixed(2)}</span>
            )}
          </div>
          <div className="flex justify-between font-bold text-base border-t border-border pt-2 mt-2">
            <span>Total</span>
            <span className="text-primary">${(totalPrice + getDeliveryFee(totalPrice)).toFixed(2)}</span>
          </div>
        </div>
        <button
          onClick={onCheckout}
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-base hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          Proceed to Checkout
        </button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          💳 Cash on Delivery only
        </p>
      </div>
    </div>
  );
}

function CartPage({
  cart,
  updateQuantity,
  removeFromCart,
  onCheckout,
  onBack,
  totalPrice,
}: {
  cart: CartItem[];
  updateQuantity: (id: string, delta: number, variantName?: string) => void;
  removeFromCart: (id: string, variantName?: string) => void;
  onCheckout: () => void;
  onBack: () => void;
  totalPrice: number;
}) {
  return (
    <div className="flex flex-col" style={{ height: "100dvh" }}>
      <div className="px-4 py-3.5 border-b border-border flex items-center gap-3 bg-card shrink-0">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={22} />
        </button>
        <h2
          className="text-lg font-bold text-foreground"
          style={{ fontFamily: "var(--font-display-family)" }}
        >
          Shopping Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
        </h2>
      </div>
      <div className="flex-1 overflow-hidden">
        <CartContent
          cart={cart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          onCheckout={onCheckout}
          onContinue={onBack}
          totalPrice={totalPrice}
        />
      </div>
    </div>
  );
}

function CartDrawer({
  open,
  onClose,
  cart,
  updateQuantity,
  removeFromCart,
  onCheckout,
  totalPrice,
}: {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (id: string, delta: number, variantName?: string) => void;
  removeFromCart: (id: string, variantName?: string) => void;
  onCheckout: () => void;
  totalPrice: number;
}) {
  return (
    <>
      {open && (
        <div
          className="hidden md:block fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40"
          onClick={onClose}
        />
      )}
      <div
        className={`hidden md:flex flex-col fixed top-0 right-0 h-full w-96 bg-card shadow-2xl z-50 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2
            className="text-lg font-bold text-foreground"
            style={{ fontFamily: "var(--font-display-family)" }}
          >
            Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <CartContent
            cart={cart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            onCheckout={onCheckout}
            onContinue={onClose}
            totalPrice={totalPrice}
          />
        </div>
      </div>
    </>
  );
}

function CheckoutPage({
  cart,
  totalPrice,
  orderForm,
  setOrderForm,
  onPlaceOrder,
  onBack,
}: {
  cart: CartItem[];
  totalPrice: number;
  orderForm: { name: string; phone: string; address: string; notes: string };
  setOrderForm: React.Dispatch<
    React.SetStateAction<{ name: string; phone: string; address: string; notes: string }>
  >;
  onPlaceOrder: () => void;
  onBack: () => void;
}) {
  const phoneValid = isValidLebanesePhone(orderForm.phone);
  const isValid = orderForm.name.trim() && phoneValid && orderForm.address.trim();

  const update = (field: string, value: string) =>
    setOrderForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="pb-28 md:pb-10">
      <div className="px-4 md:px-6 lg:px-10 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} />
          Back to cart
        </button>
      </div>

      <div className="max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-8 md:px-6 lg:px-10 md:items-start">
        {/* Form */}
        <div className="px-4 md:px-0">
          <h2
            className="text-2xl font-bold text-foreground mb-1"
            style={{ fontFamily: "var(--font-display-family)" }}
          >
            Delivery Details
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            We'll confirm your order via WhatsApp
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="e.g. Sarah Johnson"
                  value={orderForm.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-secondary rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Phone Number *
              </label>
              <div className="relative">
                <Phone
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="tel"
                  placeholder="please enter your phone number"
                  value={orderForm.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-secondary rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              {orderForm.phone.trim() !== "" && !phoneValid && (
                <p className="text-xs text-destructive mt-1.5">
                  Enter a valid 8-digit Lebanese number
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Delivery Address *
              </label>
              <div className="relative">
                <MapPin
                  size={15}
                  className="absolute left-4 top-4 text-muted-foreground"
                />
                <textarea
                  placeholder="Street, city, zip code..."
                  value={orderForm.address}
                  onChange={(e) => update("address", e.target.value)}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 bg-secondary rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Order Notes{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <div className="relative">
                <MessageSquare
                  size={15}
                  className="absolute left-4 top-3.5 text-muted-foreground"
                />
                <textarea
                  placeholder="Any special requests or shade preferences..."
                  value={orderForm.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  rows={2}
                  className="w-full pl-10 pr-4 py-3 bg-secondary rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            <div className="flex items-center gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200">
              <Clock size={16} className="text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                Estimated delivery:{" "}
                <strong>2–4 business days</strong>
              </p>
            </div>
            <div className="flex items-center gap-3 p-3.5 bg-green-50 rounded-xl border border-green-200">
              <Check size={16} className="text-green-600 shrink-0" />
              <p className="text-sm text-green-800">
                <strong>Cash on Delivery only</strong> — pay when your order arrives
              </p>
            </div>
          </div>

          {/* Mobile CTA */}
          <div className="md:hidden mt-6">
            <button
              onClick={onPlaceOrder}
              disabled={!isValid}
              className={`w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                isValid
                  ? "bg-[#25D366] text-white hover:bg-[#20bc5a]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <WhatsAppIcon />
              Place Order via WhatsApp
            </button>
            {!isValid && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                Please fill in all required fields
              </p>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="md:sticky md:top-20 px-4 md:px-0 mt-6 md:mt-0">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Order Summary</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cart.reduce((s, i) => s + i.quantity, 0)} items
              </p>
            </div>
            <div
              className="px-5 py-4 space-y-3 max-h-64 overflow-y-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {cart.map((item) => {
                const { product, quantity, variantName } = item;
                return (
                <div key={cartItemKey(product.id, variantName)} className="flex gap-3 items-center">
                  <div className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 ${placeholderBgFor(product.id)}`}>
                    <img
                      src={getCartItemImage(item)}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {product.title}
                      {variantName ? ` (${variantName})` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">Qty: {quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-primary shrink-0">
                    ${(product.price * quantity).toFixed(2)}
                  </p>
                </div>
                );
              })}
            </div>
            <div className="px-5 py-4 border-t border-border space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                {getDeliveryFee(totalPrice) === 0 ? (
                  <span className="text-green-600 font-semibold">Free</span>
                ) : (
                  <span className="font-medium">${DELIVERY_FEE.toFixed(2)}</span>
                )}
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-border mt-1">
                <span>Total</span>
                <span className="text-primary text-lg">${(totalPrice + getDeliveryFee(totalPrice)).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Desktop CTA */}
          <button
            onClick={onPlaceOrder}
            disabled={!isValid}
            className={`hidden md:flex w-full mt-4 py-4 rounded-2xl font-semibold text-base items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              isValid
                ? "bg-[#25D366] text-white hover:bg-[#20bc5a]"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <WhatsAppIcon />
            Place Order via WhatsApp
          </button>
          {!isValid && (
            <p className="hidden md:block text-center text-xs text-muted-foreground mt-2">
              Please fill in all required fields
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmationPage({
  orderForm,
  orderedItems,
  totalPrice,
  orderId,
  onContinueShopping,
}: {
  orderForm: { name: string; phone: string; address: string; notes: string };
  orderedItems: CartItem[];
  totalPrice: number;
  orderId: string | null;
  onContinueShopping: () => void;
}) {
  const firstName = orderForm.name.split(" ")[0] || "there";

  return (
    <div className="min-h-screen flex flex-col items-center pt-10 pb-16 px-4 md:px-6">
      <div className="w-full max-w-md">
        {/* Success circle */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-100 to-pink-200 flex items-center justify-center">
              <Check size={40} className="text-primary" strokeWidth={2.5} />
            </div>
            <span className="absolute -top-1 -right-1 text-2xl">🎉</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold text-foreground mb-2"
            style={{ fontFamily: "var(--font-display-family)" }}
          >
            Thank you, {firstName}!
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your order has been sent via WhatsApp. Our team will confirm your order shortly! 💌
          </p>
        </div>

        {/* WhatsApp banner */}
        <div className="bg-[#25D366]/10 border border-[#25D366]/25 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <WhatsAppIcon className="w-9 h-9 fill-[#25D366] shrink-0" />
          <div>
            <p className="font-bold text-green-800 text-sm">Order sent via WhatsApp ✓</p>
            <p className="text-xs text-green-700 mt-0.5">
              You'll receive a confirmation message shortly
            </p>
          </div>
        </div>

        {/* Order summary card */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Order Summary</h3>
            <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
              {orderedItems.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>
          <div className="px-5 py-4 space-y-3">
            {orderedItems.map((item) => {
              const { product, quantity, variantName } = item;
              return (
              <div key={cartItemKey(product.id, variantName)} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 ${placeholderBgFor(product.id)}`}>
                  <img
                    src={getCartItemImage(item)}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {product.title}
                    {variantName ? ` (${variantName})` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">x{quantity}</p>
                </div>
                <p className="text-sm font-bold text-primary shrink-0">
                  ${(product.price * quantity).toFixed(2)}
                </p>
              </div>
              );
            })}
          </div>
          <div className="px-5 py-4 border-t border-border space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              {getDeliveryFee(totalPrice) === 0 ? (
                <span className="text-green-600 font-semibold">Free</span>
              ) : (
                <span className="font-medium">${DELIVERY_FEE.toFixed(2)}</span>
              )}
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-border mt-1">
              <span>Total</span>
              <span className="text-primary">${(totalPrice + getDeliveryFee(totalPrice)).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <Clock size={13} className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Estimated delivery: <strong>2–4 business days</strong>
              </p>
            </div>
            <div className="flex items-start gap-1.5">
              <MapPin size={13} className="text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{orderForm.address}</p>
            </div>
          </div>
        </div>

        {orderId && (
          <Link
            href={`/order/${orderId}`}
            className="block w-full text-center py-3.5 mb-3 border-2 border-primary text-primary rounded-2xl font-semibold text-sm hover:bg-primary/5 transition-colors"
          >
            Track your order
          </Link>
        )}

        <button
          onClick={onContinueShopping}
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-base hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          Continue Shopping 🌸
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { cart, totalItems, totalPrice, addToCart, removeFromCart, updateQuantity, clearCart } =
    useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<Page>("catalog");
  const [category, setCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  // Lets links like "/?category=Lips" or "/?search=gloss" (from the menu
  // drawer, a shared URL, or the browser back button) drive the catalog
  // filters. Also mirrors the reverse direction: selecting a category
  // updates the URL (see handleCategoryChange) so that navigating to a
  // product and back restores the same filter and scroll position.
  useEffect(() => {
    const cat = searchParams.get("category");
    const q = searchParams.get("search");
    setCategory((cat as Category) || "All");
    setSearch(q ?? "");
    setPage("catalog");
  }, [searchParams]);

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    // Always keep an explicit ?category= param (even for "All") rather than
    // ever navigating to the bare "/" — Next.js's production Link/router
    // treats a same-pathname navigation to an empty query as a no-op when
    // the page is already at that pathname with a query string, silently
    // dropping the navigation (reproduced on the live site; not an issue
    // in `next dev`). Keeping the query non-empty sidesteps it entirely.
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", cat);
    router.replace(`/?${params.toString()}`, { scroll: false });
  };
  const [orderForm, setOrderForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [confirmedCart, setConfirmedCart] = useState<CartItem[]>([]);
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from("products").select("*");
      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data as Product[]);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  // Restore the scroll position saved (via saveScrollPosition) right before
  // navigating to a product, once the catalog is back and its content has
  // loaded. Runs once per mount of this route (see CATALOG_SCROLL_KEY).
  const restoredScrollRef = useRef(false);
  useEffect(() => {
    if (page !== "catalog" || loading || restoredScrollRef.current) return;
    restoredScrollRef.current = true;
    const saved = sessionStorage.getItem(CATALOG_SCROLL_KEY);
    if (saved) {
      sessionStorage.removeItem(CATALOG_SCROLL_KEY);
      requestAnimationFrame(() => window.scrollTo(0, Number(saved)));
    }
  }, [page, loading]);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = category === "All" || p.category === category;
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCartClick = () => {
    if (window.innerWidth >= 768) {
      setCartOpen(true);
    } else {
      setPage("cart");
    }
  };

  const handleCheckout = () => {
    setCartOpen(false);
    setPage("checkout");
  };

  const handlePlaceOrder = () => {
    const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    // Generated up front (rather than read back after the insert) so it can
    // be included in the WhatsApp message, which must be opened synchronously
    // below — before any await — so mobile browsers don't block the popup.
    const orderId = crypto.randomUUID();
    const trackingUrl = `${window.location.origin}/order/${orderId}`;
    const message = buildWhatsAppMessage(cart, orderForm, totalPrice, trackingUrl);

    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, "_blank");

    setConfirmedCart([...cart]);
    setConfirmedTotal(totalPrice);
    setConfirmedOrderId(orderId);
    clearCart();
    setCartOpen(false);
    setPage("confirmation");

    supabase
      .from("orders")
      .insert({
        id: orderId,
        customer_name: orderForm.name,
        customer_phone: orderForm.phone,
        address: orderForm.address,
        notes: orderForm.notes || null,
        items: cart.map(({ product, quantity, variantName }) => ({
          id: product.id,
          title: product.title,
          price: product.price,
          quantity,
          variant: variantName ?? null,
        })),
        total: totalPrice + getDeliveryFee(totalPrice),
      })
      .then(({ error }) => {
        if (error) console.error("Failed to save order:", error);
      });
  };

  const isMobileCartPage = page === "cart";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading products…</p>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "catalog":
        return (
          <CatalogPage
            products={filteredProducts}
            category={category}
            setCategory={handleCategoryChange}
            onAddToCart={addToCart}
          />
        );
      case "cart":
        return (
          <CartPage
            cart={cart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            onCheckout={handleCheckout}
            onBack={() => setPage("catalog")}
            totalPrice={totalPrice}
          />
        );
      case "checkout":
        return (
          <CheckoutPage
            cart={cart}
            totalPrice={totalPrice}
            orderForm={orderForm}
            setOrderForm={setOrderForm}
            onPlaceOrder={handlePlaceOrder}
            onBack={() => setPage("cart")}
          />
        );
      case "confirmation":
        return (
          <ConfirmationPage
            orderForm={orderForm}
            orderedItems={confirmedCart}
            totalPrice={confirmedTotal}
            orderId={confirmedOrderId}
            onContinueShopping={() => setPage("catalog")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {!isMobileCartPage && (
        <Header
          totalItems={totalItems}
          onCartClick={handleCartClick}
          onLogoClick={() => setPage("catalog")}
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={handleCategoryChange}
          showSearch={page === "catalog"}
        />
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        onCheckout={handleCheckout}
        totalPrice={totalPrice}
      />

      <main>{renderPage()}</main>

      {page === "catalog" && <Footer />}

      {/* Mobile floating cart button */}
      {page === "catalog" && totalItems > 0 && (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => setPage("cart")}
            className="flex items-center gap-2.5 bg-primary text-primary-foreground px-5 py-3.5 rounded-full shadow-xl font-semibold text-sm hover:bg-primary/90 active:scale-[0.97] transition-all"
            style={{ boxShadow: "0 8px 32px rgba(200,75,110,0.35)" }}
          >
            <ShoppingBag size={17} />
            View Cart
            <span className="bg-white text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold leading-none">
              {totalItems}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <AppContent />
    </Suspense>
  );
}
