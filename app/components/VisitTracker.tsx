"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/login")) return;

    supabase
      .from("page_views")
      .insert({ path: pathname })
      .then(({ error }) => {
        if (error) console.error("Failed to log page view:", error);
      });
  }, [pathname]);

  return null;
}
