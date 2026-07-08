"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2, Plus, LogOut, X, Upload, Eye, ShoppingCart, DollarSign } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

const supabase = createClient();

type ProductVariant = {
  name: string;
  image_url: string | null;
  stock: number;
};

type Product = {
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
};

type VariantFormRow = {
  name: string;
  image_url: string;
  stock: string;
};

type OrderItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  notes: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
};

type PageView = {
  id: string;
  path: string;
  created_at: string;
};

const CATEGORIES = ["Lips", "Eyes", "Face", "Skincare", "Sets", "Body Mist"];
const ORDER_STATUSES = ["pending", "confirmed", "delivered", "cancelled"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday as start of week
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfMonth(d: Date) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

function statsSince<T extends { created_at: string }>(items: T[], since: Date) {
  return items.filter((item) => new Date(item.created_at) >= since);
}

const EMPTY_FORM = {
  title: "",
  description: "",
  price: "",
  original_price: "",
  rating: "5",
  reviews_count: "0",
  category: CATEGORIES[0],
  image_url: "",
  stock: "0",
  is_new: false,
  is_bestseller: false,
  variants: [] as VariantFormRow[],
};

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [tab, setTab] = useState<"products" | "orders" | "analytics">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) router.replace("/login");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) router.replace("/login");
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (session) {
      fetchProducts();
      fetchOrders();
      fetchPageViews();
    }
  }, [session]);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("title");
    if (!error && data) setProducts(data as Product[]);
    setLoading(false);
  }

  async function fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setOrders(data as Order[]);
  }

  async function fetchPageViews() {
    const since = new Date();
    since.setDate(since.getDate() - 60);
    const { data, error } = await supabase
      .from("page_views")
      .select("*")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });
    if (!error && data) setPageViews(data as PageView[]);
  }

  async function handleStatusChange(id: string, status: string) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    await supabase.from("orders").update({ status }).eq("id", id);
  }

  async function handleDeleteOrder(id: string) {
    if (!confirm("Delete this order?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (!error) setOrders((prev) => prev.filter((o) => o.id !== id));
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setEditingId(product.id);
    setForm({
      title: product.title,
      description: product.description,
      price: String(product.price),
      original_price: product.original_price ? String(product.original_price) : "",
      rating: String(product.rating),
      reviews_count: String(product.reviews_count),
      category: product.category,
      image_url: product.image_url,
      stock: String(product.stock),
      is_new: product.is_new,
      is_bestseller: product.is_bestseller,
      variants: (product.variants ?? []).map((v) => ({
        name: v.name,
        image_url: v.image_url ?? "",
        stock: String(v.stock),
      })),
    });
    setError(null);
    setShowForm(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const ext = file.name.split(".").pop();
      const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const path = `${uniqueId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file);

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  }

  async function handleVariantImageUpload(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVariantIndex(index);
    setError(null);

    try {
      const ext = file.name.split(".").pop();
      const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const path = `${uniqueId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file);

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({
        ...f,
        variants: f.variants.map((v, i) => (i === index ? { ...v, image_url: data.publicUrl } : v)),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setUploadingVariantIndex(null);
    }
  }

  function addVariantRow() {
    setForm((f) => ({ ...f, variants: [...f.variants, { name: "", image_url: "", stock: "0" }] }));
  }

  function removeVariantRow(index: number) {
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== index) }));
  }

  function updateVariantRow(index: number, field: keyof VariantFormRow, value: string) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.image_url) {
      setError("Please upload a product image.");
      return;
    }

    if (form.variants.some((v) => !v.name.trim())) {
      setError("Every shade needs a name (or remove the empty row).");
      return;
    }

    setSaving(true);
    setError(null);

    const variants =
      form.variants.length > 0
        ? form.variants.map((v) => ({
            name: v.name.trim(),
            image_url: v.image_url || null,
            stock: parseInt(v.stock, 10) || 0,
          }))
        : null;

    const payload = {
      title: form.title,
      description: form.description,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      rating: parseFloat(form.rating),
      reviews_count: parseInt(form.reviews_count, 10),
      category: form.category,
      image_url: form.image_url,
      // With shades, stock is the sum of each shade's stock — the single
      // "Stock" field only applies to products without shades.
      stock: variants ? variants.reduce((sum, v) => sum + v.stock, 0) : parseInt(form.stock, 10),
      is_new: form.is_new,
      is_bestseller: form.is_bestseller,
      variants,
    };

    const { error } = editingId
      ? await supabase.from("products").update(payload).eq("id", editingId)
      : await supabase.from("products").insert(payload);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowForm(false);
    fetchProducts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) fetchProducts();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (session === undefined || (session && loading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 sm:h-16">
        <h1
          className="text-lg sm:text-xl font-bold text-primary"
          style={{ fontFamily: "var(--font-display-family)" }}
        >
          Admin — Products
        </h1>
        <div className="flex items-center gap-3">
          {tab === "products" && (
            <button
              onClick={openCreateForm}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus size={16} />
              Add New Product
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm shrink-0"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </header>

      <div className="px-4 sm:px-6 pt-4 flex gap-2">
        <button
          onClick={() => setTab("products")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            tab === "products"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            tab === "orders"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          Orders {orders.length > 0 ? `(${orders.length})` : ""}
        </button>
        <button
          onClick={() => setTab("analytics")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            tab === "analytics"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          Analytics
        </button>
      </div>

      {tab === "products" && (
      <main className="p-4 sm:p-6">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3 font-semibold">Product</th>
                <th className="p-3 font-semibold">Category</th>
                <th className="p-3 font-semibold">Price</th>
                <th className="p-3 font-semibold">Stock</th>
                <th className="p-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image_url}
                        alt={p.title}
                        onError={(e) => {
                          e.currentTarget.style.visibility = "hidden";
                        }}
                        className="w-10 h-10 rounded-lg object-cover bg-secondary shrink-0"
                      />
                      <span className="font-medium text-foreground whitespace-nowrap">{p.title}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{p.category}</td>
                  <td className="p-3 font-semibold text-primary whitespace-nowrap">${p.price.toFixed(2)}</td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {p.stock}
                    {p.variants && p.variants.length > 0 && (
                      <span className="text-xs text-muted-foreground/70">
                        {" "}
                        ({p.variants.length} shades)
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditForm(p)}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 rounded-lg hover:bg-secondary text-destructive transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No products yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </main>
      )}

      {tab === "orders" && (
      <main className="p-4 sm:p-6">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3 font-semibold">Customer</th>
                <th className="p-3 font-semibold">Items</th>
                <th className="p-3 font-semibold">Total</th>
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 align-top">
                  <td className="p-3">
                    <p className="font-medium text-foreground whitespace-nowrap">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{o.customer_phone}</p>
                    <p className="text-xs text-muted-foreground max-w-[200px]">{o.address}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {o.items.map((item) => (
                      <p key={item.id} className="whitespace-nowrap">
                        {item.title} x{item.quantity}
                      </p>
                    ))}
                  </td>
                  <td className="p-3 font-semibold text-primary whitespace-nowrap">
                    ${o.total.toFixed(2)}
                  </td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className="px-2 py-1.5 bg-secondary rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDeleteOrder(o.id)}
                      className="p-2 rounded-lg hover:bg-secondary text-destructive transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </main>
      )}

      {tab === "analytics" && (
        <main className="p-4 sm:p-6">
          {(() => {
            const now = new Date();
            const periods = [
              { label: "Today", since: startOfDay(now) },
              { label: "This Week", since: startOfWeek(now) },
              { label: "This Month", since: startOfMonth(now) },
            ];

            return (
              <div className="grid gap-4 sm:grid-cols-3">
                {periods.map(({ label, since }) => {
                  const visits = statsSince(pageViews, since).length;
                  const periodOrders = statsSince(orders, since);
                  const orderCount = periodOrders.length;
                  const revenue = periodOrders.reduce((sum, o) => sum + o.total, 0);
                  const conversionRate = visits > 0 ? (orderCount / visits) * 100 : 0;

                  return (
                    <div
                      key={label}
                      className="bg-card rounded-2xl border border-border p-5"
                    >
                      <h3 className="font-semibold text-foreground mb-4">{label}</h3>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Eye size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Visits</p>
                            <p className="text-lg font-bold text-foreground">{visits}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <ShoppingCart size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Orders</p>
                            <p className="text-lg font-bold text-foreground">
                              {orderCount}
                              {visits > 0 && (
                                <span className="text-xs font-normal text-muted-foreground ml-1.5">
                                  ({conversionRate.toFixed(1)}% conversion)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <DollarSign size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Revenue</p>
                            <p className="text-lg font-bold text-foreground">${revenue.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <p className="text-xs text-muted-foreground mt-6">
            Visits are logged automatically whenever someone opens the shop, a product page, or the About page.
          </p>
        </main>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
              <h2 className="font-bold text-foreground">
                {editingId ? "Edit Product" : "New Product"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Price ($)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Original price ($, optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.original_price}
                    onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Stock</label>
                  {form.variants.length > 0 ? (
                    <div className="w-full px-3 py-2 bg-secondary/50 rounded-lg text-sm text-muted-foreground">
                      {form.variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0)}{" "}
                      (sum of shades below)
                    </div>
                  ) : (
                    <input
                      required
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Product Image</label>
                <div className="flex items-center gap-3">
                  {form.image_url && (
                    <img
                      src={form.image_url}
                      alt="Preview"
                      className="w-16 h-16 rounded-lg object-cover bg-secondary shrink-0"
                    />
                  )}
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-secondary rounded-lg text-sm font-medium text-foreground cursor-pointer hover:bg-primary/10 transition-colors">
                    <Upload size={15} />
                    {uploading ? "Uploading..." : form.image_url ? "Replace photo" : "Upload photo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-foreground">
                    Shades / Variants (optional)
                  </label>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    + Add shade
                  </button>
                </div>

                {form.variants.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No shades — this product will sell as a single item using the stock above.
                  </p>
                )}

                <div className="space-y-2">
                  {form.variants.map((variant, index) => (
                    <div key={index} className="flex items-center gap-2 bg-secondary rounded-lg p-2">
                      {variant.image_url ? (
                        <img
                          src={variant.image_url}
                          alt={variant.name || "Shade"}
                          className="w-10 h-10 rounded-md object-cover bg-card shrink-0"
                        />
                      ) : (
                        <label className="w-10 h-10 rounded-md bg-card flex items-center justify-center shrink-0 cursor-pointer hover:bg-primary/10 transition-colors">
                          <Upload size={13} className="text-muted-foreground" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleVariantImageUpload(index, e)}
                            disabled={uploadingVariantIndex === index}
                            className="hidden"
                          />
                        </label>
                      )}
                      <input
                        placeholder="Shade name (e.g. Ruby Red)"
                        value={variant.name}
                        onChange={(e) => updateVariantRow(index, "name", e.target.value)}
                        className="flex-1 min-w-0 px-2 py-1.5 bg-card rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={variant.stock}
                        onChange={(e) => updateVariantRow(index, "stock", e.target.value)}
                        className="w-16 px-2 py-1.5 bg-card rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariantRow(index)}
                        className="p-1.5 rounded-md hover:bg-card text-destructive transition-colors shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Rating (0-5)</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Review count
                  </label>
                  <input
                    required
                    type="number"
                    value={form.reviews_count}
                    onChange={(e) => setForm({ ...form, reviews_count: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="flex items-center gap-5 pt-1">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.is_new}
                    onChange={(e) => setForm({ ...form, is_new: e.target.checked })}
                  />
                  New
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.is_bestseller}
                    onChange={(e) => setForm({ ...form, is_bestseller: e.target.checked })}
                  />
                  Best Seller
                </label>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={saving || uploading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 mt-2"
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Product"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
