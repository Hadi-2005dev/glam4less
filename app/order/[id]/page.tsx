import Link from "next/link";
import { ChevronLeft, Clock, CheckCircle2, PackageCheck, XCircle, HelpCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Footer } from "../../components/Footer";

export const metadata = {
  title: "Track your order — Glam4Less",
};

type OrderItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  variant?: string | null;
};

type OrderStatus = {
  status: string;
  customer_name: string;
  items: OrderItem[];
  total: number;
  created_at: string;
};

const STATUS_INFO: Record<
  string,
  { label: string; message: string; icon: typeof Clock; className: string }
> = {
  pending: {
    label: "Pending",
    message: "We've received your order and will confirm it shortly.",
    icon: Clock,
    className: "bg-amber-100 text-amber-700",
  },
  confirmed: {
    label: "Confirmed",
    message: "Your order is confirmed and is being prepared.",
    icon: CheckCircle2,
    className: "bg-blue-100 text-blue-700",
  },
  delivered: {
    label: "Delivered",
    message: "Your order has been delivered. Enjoy! 🎉",
    icon: PackageCheck,
    className: "bg-green-100 text-green-700",
  },
  cancelled: {
    label: "Cancelled",
    message: "This order was cancelled. Message us on WhatsApp if that's unexpected.",
    icon: XCircle,
    className: "bg-red-100 text-red-700",
  },
};

async function getOrderStatus(id: string): Promise<OrderStatus | null> {
  const { data, error } = await supabase.rpc("get_order_status", { order_id: id }).single();
  if (error || !data) return null;
  return data as OrderStatus;
}

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderStatus(id);
  const subtotal = order?.items.reduce((s, i) => s + i.price * i.quantity, 0) ?? 0;
  const deliveryFee = order ? order.total - subtotal : 0;

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
        <div className="max-w-md mx-auto">
          {!order ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <HelpCircle size={24} className="text-muted-foreground" />
              </div>
              <h1
                className="text-xl font-bold text-foreground mb-2"
                style={{ fontFamily: "var(--font-display-family)" }}
              >
                Order not found
              </h1>
              <p className="text-sm text-muted-foreground">
                This tracking link looks invalid or the order no longer exists.
              </p>
            </div>
          ) : (
            <>
              {(() => {
                const info = STATUS_INFO[order.status] ?? STATUS_INFO.pending;
                const Icon = info.icon;
                return (
                  <div className="text-center mb-8">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${info.className}`}
                    >
                      <Icon size={28} />
                    </div>
                    <h1
                      className="text-2xl font-bold text-foreground mb-1"
                      style={{ fontFamily: "var(--font-display-family)" }}
                    >
                      Hi {order.customer_name.split(" ")[0]}, your order is {info.label.toLowerCase()}
                    </h1>
                    <p className="text-sm text-muted-foreground">{info.message}</p>
                  </div>
                );
              })()}

              <div className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Order Summary</h3>
                  <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} items
                  </span>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {order.items.map((item, i) => (
                    <div key={`${item.id}-${i}`} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.title}
                          {item.variant ? ` (${item.variant})` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-primary shrink-0">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-4 border-t border-border space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    {deliveryFee <= 0 ? (
                      <span className="text-green-600 font-semibold">Free</span>
                    ) : (
                      <span className="font-medium">${deliveryFee.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-border mt-1">
                    <span>Total</span>
                    <span className="text-primary">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Ordered on {new Date(order.created_at).toLocaleDateString()}
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
