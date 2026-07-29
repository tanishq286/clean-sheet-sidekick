import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import TemplateThumb from "@/components/TemplateThumb";
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
  const [params] = useSearchParams();
  const [family, setFamily] = useState<string>("All");
  const embed = params.get("embed") === "1";

  if (id) {
    const meta = getTemplate(id);
    const Template = meta.Component;
    if (embed) return <Template profile={{ ...DEMO, template_id: meta.id }} />;
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

  const families = ["All", ...new Set(TEMPLATES.map((t) => t.family ?? "Signature"))];
  const shown = family === "All" ? TEMPLATES : TEMPLATES.filter((t) => (t.family ?? "Signature") === family);

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          &larr; Founder ID
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Templates</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          {TEMPLATES.length} designs, each shown live with the same demo profile so you can compare
          them fairly. Click any one to open it full size, then apply your favourite from the Design
          page.
        </p>

        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter by family">
          {families.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFamily(f)}
              aria-pressed={family === f}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition hover:bg-muted ${
                family === f ? "border-foreground font-medium" : ""
              }`}
            >
              {f}
            </button>
          ))}
          <span className="self-center text-sm text-muted-foreground tabular-nums">
            {shown.length} shown
          </span>
        </div>

        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => (
            <li key={t.id}>
              <Link
                to={`/templates/${t.id}`}
                className="group block rounded-xl border p-3 transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <TemplateThumb id={t.id} title={t.name} />
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <span className="font-medium group-hover:underline">{t.name}</span>
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {t.family ?? "Signature"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
