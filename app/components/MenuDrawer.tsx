"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Search, Instagram, Users, Info, Truck } from "lucide-react";
import { INSTAGRAM_URL, WHATSAPP_COMMUNITY_URL, WhatsAppIcon } from "./Footer";

const MENU_CATEGORIES = ["All", "Lips", "Eyes", "Face", "Skincare", "Sets", "Body Mist"];

export function MenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(searchValue.trim() ? `/?search=${encodeURIComponent(searchValue.trim())}` : "/");
    onClose();
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-50"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-card shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <span
            className="text-lg font-bold text-primary"
            style={{ fontFamily: "var(--font-display-family)" }}
          >
            Menu
          </span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="px-5 py-4 border-b border-border shrink-0">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 bg-secondary rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </form>

        <nav className="flex-1 overflow-y-auto px-3 py-3" style={{ scrollbarWidth: "none" }}>
          <p className="px-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Shop by category
          </p>
          {MENU_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/?category=${encodeURIComponent(cat)}`}
              onClick={onClose}
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              {cat === "All" ? "All Products" : cat}
            </Link>
          ))}

          <div className="my-3 border-t border-border" />

          <Link
            href="/about"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <Info size={16} />
            About Us
          </Link>
          <Link
            href="/shipping"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <Truck size={16} />
            Shipping &amp; Returns
          </Link>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <WhatsAppIcon className="w-4 h-4 fill-current" />
            Contact via WhatsApp
          </a>
        </nav>

        <div className="px-5 py-4 border-t border-border flex items-center gap-4 shrink-0">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Instagram size={20} />
          </a>
          <a
            href={WHATSAPP_COMMUNITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Users size={20} />
          </a>
        </div>
      </div>
    </>
  );
}
