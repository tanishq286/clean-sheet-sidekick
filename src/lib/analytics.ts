import { callRpc, firstRow } from "@/lib/rpc";

const VISITOR_KEY = "founderid-visitor";

/**
 * A stable random id for this browser, used only to collapse a refresh into a
 * single visit. It is not derived from anything about the person — no IP, no
 * fingerprint — and it never leaves localStorage except as an opaque string.
 */
function visitorHash(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let v = window.localStorage.getItem(VISITOR_KEY);
    if (!v) {
      v =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(VISITOR_KEY, v);
    }
    return v;
  } catch {
    // Private mode / storage blocked — the view still counts, it just can't be
    // de-duplicated across refreshes.
    return null;
  }
}

/**
 * Records a view of a published profile.
 *
 * Fire-and-forget by design: analytics must never delay or break the page, so
 * every failure is swallowed. The RPC ignores the owner's own visits and
 * collapses repeat hits within 30 minutes.
 */
export async function recordProfileView(slug: string): Promise<void> {
  try {
    await callRpc("record_profile_view", {
      _slug: slug,
      _visitor: visitorHash(),
      // Same-origin navigations tell us nothing; only external referrers do.
      _referrer:
        typeof document !== "undefined" && document.referrer && !document.referrer.includes(window.location.host)
          ? document.referrer
          : null,
    });
  } catch {
    /* analytics is never worth an error surfaced to a visitor */
  }
}

export interface ViewStats {
  total: number;
  last_7d: number;
  last_30d: number;
}

export async function fetchMyViewStats(): Promise<ViewStats> {
  const { data } = await callRpc<ViewStats | ViewStats[]>("my_profile_view_stats");
  return firstRow(data) ?? { total: 0, last_7d: 0, last_30d: 0 };
}
