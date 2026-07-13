"use client";

import { useState } from "react";
import {
  Star,
  ChevronLeft,
  Minus,
  Plus,
  ShoppingBag,
  Check,
  Clock,
  Share2,
} from "lucide-react";

export interface ProductVariant {
  name: string;
  image_url: string | null;
  stock: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price: number | null;
  rating: number;
  reviews_count: number;
  category: string;
  image_url: string;
  stock: number;
  is_new: boolean;
  is_bestseller: boolean;
  variants?: ProductVariant[] | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variantName?: string;
}

export const DELIVERY_FEE = 3;
export const FREE_DELIVERY_THRESHOLD = 25;

export function getDeliveryFee(subtotal: number) {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

const VALID_LB_MOBILE_PREFIXES = ["03", "70", "71", "76", "78", "79", "81"];

export function isValidLebanesePhone(phone: string) {
  const digits = phone.replace(/[\s-]/g, "");
  if (!/^\d{8}$/.test(digits)) return false;
  return VALID_LB_MOBILE_PREFIXES.includes(digits.slice(0, 2));
}

export const BADGE_COLORS: Record<string, string> = {
  "Best Seller": "bg-rose-500 text-white",
  "New": "bg-violet-500 text-white",
  "Sale": "bg-amber-500 text-white",
  "Hot Deal": "bg-red-500 text-white",
};

const PLACEHOLDER_COLORS = [
  "bg-pink-100", "bg-rose-100", "bg-fuchsia-100", "bg-purple-100",
  "bg-pink-50", "bg-rose-50",
];

export function getBadge(product: Product): string | undefined {
  if (product.is_bestseller) return "Best Seller";
  if (product.is_new) return "New";
  if (product.original_price) return "Sale";
  return undefined;
}

function hashId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function placeholderBgFor(id: string) {
  return PLACEHOLDER_COLORS[hashId(id) % PLACEHOLDER_COLORS.length];
}

export function cartItemKey(productId: string, variantName?: string) {
  return variantName ? `${productId}::${variantName}` : productId;
}

export function getVariantStock(product: Product, variantName?: string) {
  if (!variantName) return product.stock;
  const variant = product.variants?.find((v) => v.name === variantName);
  return variant ? variant.stock : product.stock;
}

export function getCartItemImage(item: CartItem) {
  const variant = item.product.variants?.find((v) => v.name === item.variantName);
  return variant?.image_url || item.product.image_url;
}

export function buildWhatsAppMessage(
  cart: CartItem[],
  orderForm: { name: string; phone: string; address: string; notes: string },
  subtotal: number,
  trackingUrl?: string
) {
  const lines = cart.map(
    ({ product, quantity, variantName }) =>
      `• ${product.title}${variantName ? ` (${variantName})` : ""} x${quantity} — $${(
        product.price * quantity
      ).toFixed(2)}`
  );

  const deliveryFee = getDeliveryFee(subtotal);

  return [
    `New order from ${orderForm.name}`,
    "",
    ...lines,
    "",
    `Subtotal: $${subtotal.toFixed(2)}`,
    `Delivery: ${deliveryFee === 0 ? "Free" : `$${deliveryFee.toFixed(2)}`}`,
    `Total: $${(subtotal + deliveryFee).toFixed(2)}`,
    "",
    `Phone: ${orderForm.phone}`,
    `Address: ${orderForm.address}`,
    orderForm.notes ? `Notes: ${orderForm.notes}` : null,
    trackingUrl ? "" : null,
    trackingUrl ? `Track your order: ${trackingUrl}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function StarRating({ rating, size = 10 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-gray-200 fill-gray-200"
          }
        />
      ))}
    </div>
  );
}

export function ProductDetail({
  product,
  onBack,
  onAddToCart,
}: {
  product: Product;
  onBack: () => void;
  onAddToCart: (p: Product, qty: number, variantName?: string) => void;
}) {
  const hasVariants = !!product.variants && product.variants.length > 0;
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    hasVariants ? product.variants![0].name : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [shared, setShared] = useState(false);
  const badge = getBadge(product);
  const placeholderBg = placeholderBgFor(product.id);

  const stock = getVariantStock(product, selectedVariant);
  const displayImage =
    product.variants?.find((v) => v.name === selectedVariant)?.image_url || product.image_url;

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Check out ${product.title} on Glam4Less — $${product.price.toFixed(2)}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: product.title, text, url });
      } catch {
        // user cancelled the native share sheet — nothing to do
      }
      return;
    }

    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
      "_blank"
    );
    setShared(true);
    setTimeout(() => setShared(false), 1500);
  };

  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  return (
    <div className="pb-28 md:pb-10">
      <div className="px-4 md:px-6 lg:px-10 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} />
          Back to catalog
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {shared ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
          {shared ? "Shared!" : "Share"}
        </button>
      </div>

      <div className="max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-8 md:px-6 lg:px-10 md:items-start">
        {/* Image */}
        <div className="md:sticky md:top-20 md:self-start">
          <div className={`aspect-square md:aspect-[4/5] ${placeholderBg} md:rounded-2xl overflow-hidden`}>
            <img
              src={displayImage}
              alt={product.title}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Details */}
        <div className="px-4 md:px-0 pt-5 md:pt-2">
          {badge && (
            <span
              className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3 ${
                BADGE_COLORS[badge] ?? "bg-primary text-primary-foreground"
              }`}
            >
              {badge}
            </span>
          )}
          <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
          <h1
            className="text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight"
            style={{ fontFamily: "var(--font-display-family)" }}
          >
            {product.title}
          </h1>

          <div className="flex items-center gap-2 mb-4">
            <StarRating rating={product.rating} size={14} />
            <span className="text-sm font-semibold text-foreground">{product.rating}</span>
            <span className="text-sm text-muted-foreground">({product.reviews_count} reviews)</span>
          </div>

          <div className="flex items-baseline gap-2 mb-5">
            <span className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</span>
            {product.original_price && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  ${product.original_price.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {discount}% off
                </span>
              </>
            )}
          </div>

          <div className="bg-secondary rounded-2xl p-4 mb-5">
            <p className="text-sm text-foreground leading-relaxed">{product.description}</p>
          </div>

          {hasVariants && (
            <div className="mb-5">
              <span className="text-sm font-semibold text-foreground">
                Shade{selectedVariant ? `: ${selectedVariant}` : ""}
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {product.variants!.map((variant) => (
                  <button
                    key={variant.name}
                    onClick={() => {
                      setSelectedVariant(variant.name);
                      setQuantity(1);
                    }}
                    disabled={variant.stock === 0}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      variant.stock === 0
                        ? "opacity-40 cursor-not-allowed border-border text-muted-foreground"
                        : selectedVariant === variant.name
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-primary/50"
                    }`}
                  >
                    {variant.name}
                    {variant.stock === 0 ? " (out of stock)" : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {stock > 0 && (
            <>
              {/* Quantity selector */}
              <div className="flex items-center gap-4 mb-2">
                <span className="text-sm font-semibold text-foreground">Quantity</span>
                <div className="flex items-center gap-3 bg-secondary rounded-full px-1.5 py-1.5">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-sm hover:bg-primary/10 transition-colors active:scale-95"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center font-bold text-foreground text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                    disabled={quantity >= stock}
                    className="w-8 h-8 rounded-full bg-card flex items-center justify-center shadow-sm hover:bg-primary/10 transition-colors active:scale-95 disabled:opacity-40 disabled:hover:bg-card"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {stock <= 5 && (
                <p className="text-xs text-amber-600 font-medium mb-3">
                  Only {stock} left in stock
                </p>
              )}
            </>
          )}

          <button
            onClick={handleAdd}
            disabled={stock === 0}
            className={`w-full py-4 rounded-2xl text-base font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] ${
              stock === 0
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : added
                ? "bg-green-500 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {stock === 0 ? (
              "Out of Stock"
            ) : added ? (
              <>
                <Check size={18} />
                Added to Cart!
              </>
            ) : (
              <>
                <ShoppingBag size={18} />
                Add to Cart — ${(product.price * quantity).toFixed(2)}
              </>
            )}
          </button>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock size={14} className="text-primary/60" />
              <span>Estimated delivery: 2–4 business days</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check size={14} className="text-green-500" />
              <span>Cash on Delivery available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
