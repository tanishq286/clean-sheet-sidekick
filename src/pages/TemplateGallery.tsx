import { Link, useParams } from "react-router-dom";
import { TEMPLATES, getTemplate } from "@/templates/registry";
import type { FullProfile } from "@/types/founder";

/**
 * Public gallery for every registered template, rendered with demo data.
 *
 * With 36 designs, "switch my live profile and look at it" is a poor way to
 * choose one. This route renders any template in isolation, needs no auth and
 * touches no real profile — which also gives the browser sweep a stable URL to
 * drive, so every template stays covered as presets are added.
 */
const DEMO: Omit<FullProfile, "template_id"> = {
  id: "demo", slug: "demo", is_published: true,
  theme: { accent: "#FF6B35", mode: "dark", fontPreset: "rubik" },
  identity: {
    name: "Ada Rao", headline: "Founder · Building Northwind · IIT Bombay '24",
    bio: "Operations lead turned founder. I build routing software that lets small retailers deliver like a national chain.",
    location: "Bengaluru, India", college: "IIT Bombay",
    linkedin: "https://example.com/in/demo", website: "https://example.com",
  },
  founder: {
    current_venture: "Northwind", industry: "Logistics", stage: "mvp",
    problem: "Small retailers lose a fifth of their margin to inefficient last-mile delivery.",
    mission: "Give every corner store the delivery stack of a national chain.",
  },
  vision: {
    problem_solving: "Last-mile cost for independent retail.",
    why_it_matters: "Margins decide whether a small shop survives its second year.",
  },
  contact: { email: "hello@example.com" },
  looking_for: ["cofounder", "investor"],
  created_at: "2026-01-04T00:00:00Z", updated_at: "2026-07-28T00:00:00Z",
  skills: [
    { id: "s1", profile_id: "demo", tag: "product" },
    { id: "s2", profile_id: "demo", tag: "logistics" },
    { id: "s3", profile_id: "demo", tag: "operations" },
  ],
  milestones: [
    { id: "m1", profile_id: "demo", year: "2022", title: "First 100 deliveries", description: "Ran the pilot manually across three neighbourhood stores.", order_index: 0 },
    { id: "m2", profile_id: "demo", year: "2023", title: "Incorporated", description: null, order_index: 1 },
    { id: "m3", profile_id: "demo", year: "2025", title: "Seed round", description: "Raised on the back of 40 paying stores.", order_index: 2 },
  ],
  portfolio: [
    { id: "x1", profile_id: "demo", kind: "pitch_deck", title: "Seed deck", description: "Twelve slides on the last-mile thesis.", url: "https://example.com/deck", file_url: null, order_index: 0 },
    { id: "x2", profile_id: "demo", kind: "website", title: "Northwind", description: "The live product.", url: "https://example.com", file_url: null, order_index: 1 },
    { id: "x3", profile_id: "demo", kind: "award", title: "Campus Founder Award", description: "Awarded 2025.", url: null, file_url: null, order_index: 2 },
  ],
};

export default function TemplateGallery() {
  const { id } = useParams<{ id?: string }>();

  if (id) {
    const meta = getTemplate(id);
    const Template = meta.Component;
    return (
      <>
        <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 bg-neutral-900 px-4 py-2 text-sm text-neutral-100">
          <span>
            Preview: <strong>{meta.name}</strong> — demo data, not your profile
          </span>
          <Link to="/templates" className="underline underline-offset-4">
            All templates
          </Link>
        </div>
        <Template profile={{ ...DEMO, template_id: meta.id }} />
      </>
    );
  }

  const families = [...new Set(TEMPLATES.map((t) => t.family ?? "Signature"))];
  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
        <p className="mt-2 text-muted-foreground">
          {TEMPLATES.length} designs, previewed with demo data. Pick one from the Design page to apply it.
        </p>
        {families.map((family) => (
          <section key={family} className="mt-10">
            <h2 className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">{family}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {TEMPLATES.filter((t) => (t.family ?? "Signature") === family).map((t) => (
                <li key={t.id}>
                  <Link to={`/templates/${t.id}`} className="block rounded-lg border p-4 transition hover:bg-muted">
                    <div className="font-medium">{t.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{t.description}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
