import { useEffect } from "react";
import type { FullProfile } from "@/types/founder";
import { buildJsonLdString, profileUrl } from "@/lib/geo/schema";
import { buildLlmsTxt } from "@/lib/geo/llms";

const JSONLD_ID = "founderid-jsonld";
const LLMS_ID = "founderid-llms";

function upsertMeta(key: string, content: string, attr: "name" | "property" = "name") {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Injects everything an AI/search crawler needs for a published profile:
 * title, description, Open Graph + Twitter cards, canonical URL, and a
 * JSON-LD @graph (Person / ProfessionalService / ItemPage).
 *
 * A Vite SPA has no server to host /llms.txt, so the llms.txt body is also
 * embedded in a hidden <script type="text/markdown"> block — crawlers that
 * execute JS can still read it, and the dashboard offers a real download.
 *
 * Renders nothing; all effects target document.head.
 */
export default function SeoHead({ profile }: { profile: FullProfile }) {
  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = profileUrl(profile, origin);
    const name = profile.identity.name || "Founder";
    const title = `${name}${profile.identity.headline ? ` — ${profile.identity.headline}` : " — Founder Profile"}`;
    const description =
      profile.identity.bio ||
      profile.founder.mission ||
      profile.founder.problem ||
      `${name}'s founder profile.`;

    document.title = title;
    upsertMeta("description", description);
    upsertCanonical(url);

    // Dynamically rendered 1200x630 card from the /api/og Netlify Function.
    const ogImage = `${origin}/api/og?${new URLSearchParams({
      name: name,
      role: profile.identity.headline || (profile.founder.current_venture ? `Founder, ${profile.founder.current_venture}` : "Founder"),
      title: description,
      theme: profile.theme?.accent ?? "#FF6B35",
    }).toString()}`;

    upsertMeta("og:type", "profile", "property");
    upsertMeta("og:title", title, "property");
    upsertMeta("og:description", description, "property");
    upsertMeta("og:url", url, "property");
    upsertMeta("og:image", ogImage, "property");
    upsertMeta("og:image:width", "1200", "property");
    upsertMeta("og:image:height", "630", "property");
    upsertMeta("og:image:alt", `${name} — founder profile card`, "property");

    upsertMeta("twitter:card", "summary_large_image");
    upsertMeta("twitter:title", title);
    upsertMeta("twitter:description", description);
    upsertMeta("twitter:image", ogImage);

    // Explicitly welcome AI crawlers on published profiles.
    upsertMeta("robots", profile.is_published ? "index, follow, max-snippet:-1, max-image-preview:large" : "noindex");

    let ld = document.getElementById(JSONLD_ID) as HTMLScriptElement | null;
    if (!ld) {
      ld = document.createElement("script");
      ld.id = JSONLD_ID;
      ld.type = "application/ld+json";
      document.head.appendChild(ld);
    }
    ld.textContent = buildJsonLdString(profile, origin);

    let llms = document.getElementById(LLMS_ID) as HTMLScriptElement | null;
    if (!llms) {
      llms = document.createElement("script");
      llms.id = LLMS_ID;
      llms.type = "text/markdown";
      llms.setAttribute("data-llms", "llms.txt");
      document.head.appendChild(llms);
    }
    llms.textContent = buildLlmsTxt(profile, origin);

    return () => {
      document.getElementById(JSONLD_ID)?.remove();
      document.getElementById(LLMS_ID)?.remove();
    };
  }, [profile]);

  return null;
}
