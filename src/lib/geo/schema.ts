import type { FullProfile } from "@/types/founder";
import { SKILL_LABEL, STAGE_LABEL, LOOKING_LABEL, PORTFOLIO_LABEL } from "@/templates/shared/themeStyle";

/**
 * JSON-LD structured data generators.
 *
 * Search engines and AI answer engines (ChatGPT Search, Perplexity, Gemini)
 * lean heavily on schema.org markup to understand *who* a page is about and
 * *what* they offer. We emit a @graph containing:
 *   - Person            — the founder themselves (knowsAbout = their skills)
 *   - ProfessionalService — what they offer (hasOfferCatalog = looking_for)
 *   - ItemPage          — the page wrapper tying it together
 */

/** Minimal JSON-LD value type — avoids `any` while staying schema-agnostic. */
export type JsonLdValue = string | number | boolean | null | JsonLdObject | JsonLdValue[];
export interface JsonLdObject {
  [key: string]: JsonLdValue | undefined;
}

function compact(obj: JsonLdObject): JsonLdObject {
  const out: JsonLdObject = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

export function profileUrl(profile: FullProfile, origin: string): string {
  return `${origin.replace(/\/$/, "")}/u/${profile.slug}`;
}

export function skillLabels(profile: FullProfile): string[] {
  return profile.skills.map((s) => SKILL_LABEL[s.tag] ?? s.tag);
}

/** schema.org/Person — the founder. `knowsAbout` is the key AEO signal. */
export function buildPersonSchema(profile: FullProfile, origin: string): JsonLdObject {
  const { identity, founder, contact } = profile;
  const url = profileUrl(profile, origin);
  const sameAs = [identity.linkedin, identity.website, contact.twitter].filter(
    (v): v is string => typeof v === "string" && v.trim().length > 0,
  );

  return compact({
    "@type": "Person",
    "@id": `${url}#person`,
    name: identity.name || "Founder",
    url,
    description: identity.bio,
    image: identity.photo_url,
    jobTitle: identity.headline || (founder.current_venture ? `Founder, ${founder.current_venture}` : "Founder"),
    email: contact.email ? `mailto:${contact.email}` : undefined,
    telephone: contact.phone,
    knowsAbout: skillLabels(profile),
    alumniOf: identity.college
      ? compact({ "@type": "EducationalOrganization", name: identity.college })
      : undefined,
    homeLocation: identity.location
      ? compact({ "@type": "Place", name: identity.location })
      : undefined,
    worksFor: founder.current_venture
      ? compact({
          "@type": "Organization",
          name: founder.current_venture,
          description: founder.mission || founder.problem,
          industry: founder.industry,
        })
      : undefined,
    sameAs,
  });
}

/**
 * schema.org/ProfessionalService — what the founder is open to.
 * `hasOfferCatalog` maps directly from `looking_for`, which is exactly the
 * "what can this person help me with" question AI engines try to answer.
 */
export function buildServiceSchema(profile: FullProfile, origin: string): JsonLdObject {
  const { identity, founder, looking_for } = profile;
  const url = profileUrl(profile, origin);
  if (looking_for.length === 0 && !founder.current_venture) return {};

  return compact({
    "@type": "ProfessionalService",
    "@id": `${url}#service`,
    name: founder.current_venture || identity.name || "Founder profile",
    url,
    description: founder.mission || founder.problem || identity.bio,
    provider: { "@id": `${url}#person` },
    areaServed: identity.location,
    knowsAbout: skillLabels(profile),
    hasOfferCatalog:
      looking_for.length > 0
        ? compact({
            "@type": "OfferCatalog",
            name: "Open to",
            itemListElement: looking_for.map((l) =>
              compact({
                "@type": "Offer",
                itemOffered: compact({ "@type": "Service", name: LOOKING_LABEL[l] ?? l }),
              }),
            ),
          })
        : undefined,
  });
}

/** schema.org/ItemPage — the page itself, plus portfolio as a CreativeWork list. */
export function buildItemPageSchema(profile: FullProfile, origin: string): JsonLdObject {
  const { identity, portfolio } = profile;
  const url = profileUrl(profile, origin);

  return compact({
    "@type": "ItemPage",
    "@id": `${url}#page`,
    url,
    name: `${identity.name || "Founder"} — Founder Profile`,
    description: identity.bio,
    mainEntity: { "@id": `${url}#person` },
    dateModified: profile.updated_at,
    hasPart:
      portfolio.length > 0
        ? portfolio.map((p) =>
            compact({
              "@type": "CreativeWork",
              name: p.title,
              description: p.description,
              url: p.url ?? p.file_url ?? undefined,
              genre: PORTFOLIO_LABEL[p.kind] ?? p.kind,
            }),
          )
        : undefined,
  });
}

/** Full @graph document ready to drop into a <script type="application/ld+json">. */
export function buildJsonLd(profile: FullProfile, origin: string): JsonLdObject {
  const graph = [
    buildPersonSchema(profile, origin),
    buildServiceSchema(profile, origin),
    buildItemPageSchema(profile, origin),
  ].filter((node) => Object.keys(node).length > 0);

  return { "@context": "https://schema.org", "@graph": graph };
}

export function buildJsonLdString(profile: FullProfile, origin: string): string {
  return JSON.stringify(buildJsonLd(profile, origin), null, 2);
}

/** Human-readable stage label, used by both schema and llms.txt output. */
export function stageLabel(profile: FullProfile): string | undefined {
  return profile.founder.stage ? STAGE_LABEL[profile.founder.stage] : undefined;
}
