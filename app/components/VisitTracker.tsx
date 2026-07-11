"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const LAST_VISIT_KEY = "g4l_last_visit_at";
const VISIT_SESSION_MS = 30 * 60 * 1000;

export function VisitTracker() {
  const pathname = usePathname();

  // Runs once per app load (not on every client-side navigation) so a
  // single site visit isn't counted once per page browsed. A visit is
  // only re-logged after VISIT_SESSION_MS has passed since the last one.
  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/login")) return;

    let cancelled = false;

    async function trackVisit() {
      const { data } = await supabase.auth.getSession();
      if (cancelled || data.session) return; // don't count logged-in admins

      const lastVisit = Number(localStorage.getItem(LAST_VISIT_KEY) || 0);
      if (Date.now() - lastVisit < VISIT_SESSION_MS) return;

      localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
      const { error } = await supabase.from("page_views").insert({ path: pathname });
      if (error) console.error("Failed to log page view:", error);
    }

    trackVisit();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
