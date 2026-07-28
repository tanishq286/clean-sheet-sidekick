import type { CSSProperties, ReactNode } from "react";
import type { TemplateProps } from "../types";
import { STAGE_LABEL, LOOKING_LABEL, SKILL_LABEL } from "../shared/themeStyle";
import Milestones from "@/components/Milestones";
import Portfolio from "@/components/Portfolio";
import { FONTS, TYPE_RAMP, type TemplateSpec } from "./spec";

/**
 * Renders any TemplateSpec.
 *
 * All colour comes from the spec via CSS custom properties, so a preset never
 * writes Tailwind colour classes and can never drift from its own palette. The
 * interactive sections read `currentColor`, which means they inherit whatever
 * the spec set without any per-preset wiring.
 */

interface Props extends TemplateProps {
  spec: TemplateSpec;
}

function Eyebrow({ spec, children }: { spec: TemplateSpec; children: ReactNode }) {
  const ramp = TYPE_RAMP[spec.scale];
  return (
    <div
      className={`${ramp.eyebrow} mb-2 font-medium ${spec.eyebrow ? "uppercase tracking-[0.3em]" : ""}`}
      style={{ color: "var(--accent)" }}
    >
      {children}
    </div>
  );
}

function Section({
  spec,
  label,
  title,
  font,
  children,
}: {
  spec: TemplateSpec;
  label?: string;
  title?: string;
  /** Resolved heading face — the spec's, or the founder's chosen override. */
  font: string;
  children: ReactNode;
}) {
  const ramp = TYPE_RAMP[spec.scale];
  return (
    <section className="mb-12 last:mb-0">
      {label && <Eyebrow spec={spec}>{label}</Eyebrow>}
      {title && (
        <h2
          className={`${ramp.section} mb-4 font-semibold tracking-tight`}
          style={{ fontFamily: font }}
        >
          {title}
        </h2>
      )}
      {spec.sectionRule && (
        <div aria-hidden="true" className="mb-5 h-px w-16" style={{ backgroundColor: "var(--accent)" }} />
      )}
      {children}
    </section>
  );
}

function Chips({
  items,
  spec,
  accent = false,
}: {
  items: string[];
  spec: TemplateSpec;
  accent?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((label) => (
        <li
          key={label}
          className="px-3 py-1.5 text-sm"
          style={{
            borderRadius: spec.radius ? 9999 : 0,
            border: `1px solid ${accent ? "var(--accent)" : "var(--tpl-border)"}`,
            color: accent ? "var(--accent)" : undefined,
          }}
        >
          {label}
        </li>
      ))}
    </ul>
  );
}

function Photo({ spec, src, alt, className = "" }: { spec: TemplateSpec; src?: string; alt: string; className?: string }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`object-cover ${className}`}
      style={{
        borderRadius: spec.radius,
        filter: spec.monoPhoto ? "grayscale(1)" : undefined,
        border: `1px solid var(--tpl-border)`,
      }}
    />
  );
}

/** theme.fontPreset is a user override; the spec supplies the default. */
const PRESET_FONTS: Record<string, { heading: string; body: string }> = {
  rubik: { heading: FONTS.rubik, body: FONTS.system },
  editorial: { heading: FONTS.fraunces, body: FONTS.georgia },
  mono: { heading: FONTS.mono, body: FONTS.mono },
  serif: { heading: FONTS.serif, body: FONTS.georgia },
};

export default function ComposableTemplate({ profile, spec }: Props) {
  const { identity, founder, vision, contact, looking_for, skills, milestones, portfolio, theme } = profile;
  const ramp = TYPE_RAMP[spec.scale];

  // Typeface: the design's own pairing unless the founder picked one. Falling
  // back to the spec keeps every preset looking as intended by default.
  const override = theme?.fontPreset ? PRESET_FONTS[theme.fontPreset] : undefined;
  const headingFont = override?.heading ?? spec.headingFont;
  const bodyFont = override?.body ?? spec.bodyFont;

  // The spec drives every colour through variables so the interactive sections
  // (which style themselves from `currentColor`) stay in the same palette.
  const rootStyle = {
    "--accent": theme?.accent ?? "#FF6B35",
    "--tpl-border": spec.palette.border,
    "--tpl-muted": spec.palette.muted,
    "--tpl-surface": spec.palette.surface,
    backgroundColor: spec.palette.bg,
    color: spec.palette.fg,
    fontFamily: bodyFont,
  } as CSSProperties;

  const skillLabels = skills.map((s) => SKILL_LABEL[s.tag] ?? s.tag);
  const lookingLabels = looking_for.map((l) => LOOKING_LABEL[l] ?? l);
  const stage = founder.stage ? STAGE_LABEL[founder.stage] : null;
  const tagline = [founder.industry, stage].filter(Boolean).join(" · ");

  const identityBlock = (
    <>
      <Photo spec={spec} src={identity.photo_url} alt={identity.name ?? "Profile photo"} className="mb-5 h-28 w-28" />
      <h1 className={`${ramp.name} font-bold leading-[1.05] tracking-tight`} style={{ fontFamily: headingFont }}>
        {identity.name ?? "Unnamed Founder"}
      </h1>
      {identity.headline && (
        <p className={`${ramp.body} mt-3 leading-relaxed`} style={{ color: "var(--tpl-muted)" }}>
          {identity.headline}
        </p>
      )}
      {tagline && (
        <p className="mt-3 text-sm font-medium" style={{ color: "var(--accent)" }}>
          {tagline}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="underline-offset-4 hover:underline" style={{ color: "var(--accent)" }}>
            Email
          </a>
        )}
        {identity.linkedin && (
          <a href={identity.linkedin} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline" style={{ color: "var(--accent)" }}>
            LinkedIn
          </a>
        )}
        {identity.website && (
          <a href={identity.website} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline" style={{ color: "var(--accent)" }}>
            Website
          </a>
        )}
      </div>
    </>
  );

  const bodySections = (
    <>
      {identity.bio && (
        <Section spec={spec} font={headingFont} label={spec.eyebrow ? "About" : undefined} title="About">
          <p className={`${ramp.body} max-w-prose leading-relaxed`} style={{ color: "var(--tpl-muted)" }}>
            {identity.bio}
          </p>
        </Section>
      )}

      {(founder.current_venture || founder.problem || founder.mission) && (
        <Section spec={spec} font={headingFont} label={spec.eyebrow ? "Venture" : undefined} title={founder.current_venture || "What I'm building"}>
          <div className="space-y-4">
            {founder.problem && (
              <p className={`${ramp.body} max-w-prose leading-relaxed`}>{founder.problem}</p>
            )}
            {founder.mission && (
              <p className={`${ramp.body} max-w-prose leading-relaxed italic`} style={{ color: "var(--tpl-muted)" }}>
                {founder.mission}
              </p>
            )}
          </div>
        </Section>
      )}

      {(vision.problem_solving || vision.why_it_matters) && (
        <Section spec={spec} font={headingFont} label={spec.eyebrow ? "Vision" : undefined} title="Vision">
          <div className="space-y-4">
            {vision.problem_solving && <p className={`${ramp.body} max-w-prose leading-relaxed`}>{vision.problem_solving}</p>}
            {vision.why_it_matters && (
              <p className={`${ramp.body} max-w-prose leading-relaxed`} style={{ color: "var(--tpl-muted)" }}>
                {vision.why_it_matters}
              </p>
            )}
          </div>
        </Section>
      )}

      {milestones.length > 0 && (
        <Section spec={spec} font={headingFont} label={spec.eyebrow ? "Journey" : undefined} title="Journey">
          <Milestones milestones={milestones} showHeader={false} variant={spec.surface} />
        </Section>
      )}

      {skillLabels.length > 0 && (
        <Section spec={spec} font={headingFont} label={spec.eyebrow ? "Toolkit" : undefined} title="Skills">
          <Chips items={skillLabels} spec={spec} />
        </Section>
      )}

      {lookingLabels.length > 0 && (
        <Section spec={spec} font={headingFont} label={spec.eyebrow ? "Open to" : undefined} title="Looking for">
          <Chips items={lookingLabels} spec={spec} accent />
        </Section>
      )}

      {portfolio.length > 0 && (
        <Section spec={spec} font={headingFont} label={spec.eyebrow ? "Selected work" : undefined} title="Work">
          <Portfolio portfolio={portfolio} showHeader={false} variant={spec.surface} />
        </Section>
      )}
    </>
  );

  const wash = spec.heroWash && (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-25"
      style={{ background: "radial-gradient(70% 100% at 50% 0%, var(--accent) 0%, transparent 70%)" }}
    />
  );

  if (spec.layout === "sidebar") {
    return (
      <div style={rootStyle} className="relative min-h-screen">
        {wash}
        <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[280px_1fr] md:px-10 md:py-16">
          <aside className="md:sticky md:top-12 md:self-start">{identityBlock}</aside>
          <main>{bodySections}</main>
        </div>
      </div>
    );
  }

  if (spec.layout === "split") {
    return (
      <div style={rootStyle} className="relative min-h-screen">
        {wash}
        <div className="relative z-10">
          <div
            className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:px-10 md:py-24"
            style={{ borderBottom: `1px solid var(--tpl-border)` }}
          >
            <div>{identityBlock}</div>
            {identity.cover_url && (
              <Photo spec={spec} src={identity.cover_url} alt="Cover" className="aspect-[4/3] w-full" />
            )}
          </div>
          <main className="mx-auto max-w-4xl px-6 py-14 md:px-10">{bodySections}</main>
        </div>
      </div>
    );
  }

  if (spec.layout === "magazine") {
    return (
      <div style={rootStyle} className="relative min-h-screen">
        {wash}
        <div className="relative z-10 mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-24">
          <header className="mb-16">{identityBlock}</header>
          <main className="md:columns-2 md:gap-12 [&>section]:break-inside-avoid">{bodySections}</main>
        </div>
      </div>
    );
  }

  if (spec.layout === "grid") {
    return (
      <div style={rootStyle} className="relative min-h-screen">
        {wash}
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-12 md:px-10">
          <header
            className="mb-10 p-6 md:p-8"
            style={{ border: `1px solid var(--tpl-border)`, borderRadius: spec.radius, backgroundColor: "var(--tpl-surface)" }}
          >
            {identityBlock}
          </header>
          <main
            className="p-6 md:p-8"
            style={{ border: `1px solid var(--tpl-border)`, borderRadius: spec.radius, backgroundColor: "var(--tpl-surface)" }}
          >
            {bodySections}
          </main>
        </div>
      </div>
    );
  }

  if (spec.layout === "banner") {
    return (
      <div style={rootStyle} className="relative min-h-screen">
        <div
          className="h-40 w-full md:h-56"
          style={{
            background: identity.cover_url
              ? `url(${identity.cover_url}) center/cover`
              : "linear-gradient(120deg, var(--accent), transparent)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-4xl px-6 pb-16 md:px-10">
          <header className="-mt-14 mb-12">{identityBlock}</header>
          <main>{bodySections}</main>
        </div>
      </div>
    );
  }

  // stack
  return (
    <div style={rootStyle} className="relative min-h-screen">
      {wash}
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-16 md:px-10 md:py-24">
        <header className="mb-14">{identityBlock}</header>
        <main>{bodySections}</main>
      </div>
    </div>
  );
}
