import { Link } from "react-router-dom";
import {
  CheckCircle2, Circle, Copy, ExternalLink, PenSquare, Palette,
  Download, Rocket, Route, Sparkles, Handshake, Briefcase,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { useMyProfile, useUpdateProfile } from "@/hooks/useProfile";
import { computeCompletion } from "@/lib/completion";
import { publicProfileUrl } from "@/lib/subdomain";
import { getTemplate } from "@/templates/registry";
import { STAGE_LABEL } from "@/templates/shared/themeStyle";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import AeoScoreCard from "@/components/GeoAeoEngine/AeoScoreCard";
import ViewsCard from "@/components/ViewsCard";
import PublishToggle from "@/components/PublishToggle";
import ChangePassword from "@/components/ChangePassword";
import DeleteAccount from "@/components/DeleteAccount";
import type { FullProfile } from "@/types/founder";

export default function Dashboard() {
  const { data: profile, isLoading } = useMyProfile();

  if (isLoading) return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-16 flex items-center gap-3 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        Loading your dashboard…
      </div>
    </AppShell>
  );
  if (!profile) return <AppShell><div className="p-12">No profile found.</div></AppShell>;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <OverviewHeader profile={profile} />
        <PublishToggle profile={profile} />
        <section>
          <SectionHeading eyebrow="Reach" title="Who's seeing your profile" />
          <ViewsCard isPublished={profile.is_published} />
        </section>
        <CompletionSection profile={profile} />
        <ContentSection profile={profile} />
        <section>
          <SectionHeading eyebrow="Step 3" title="AI discoverability" />
          <AeoScoreCard profile={profile} />
        </section>
        <ManageSection profile={profile} />
        <section>
          <SectionHeading eyebrow="Account" title="Sign-in & security" />
          <ChangePassword />
        </section>
        <section>
          <SectionHeading eyebrow="Account" title="Danger zone" />
          <DeleteAccount />
        </section>
      </div>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Overview — greeting, publish status, primary actions            */
/* ------------------------------------------------------------------ */

function OverviewHeader({ profile }: { profile: FullProfile }) {
  const update = useUpdateProfile();
  const publicUrl = publicProfileUrl(profile.slug);
  const firstName = profile.identity?.name?.split(" ")[0];

  return (
    <div className="flex items-start justify-between gap-6 flex-wrap">
      <div>
        <p className="font-['JetBrains_Mono'] text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Dashboard
        </p>
        <h1 className="font-['Archivo_Black'] text-3xl tracking-tight">
          Hi{firstName ? `, ${firstName}` : ""}.
        </h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span className={`inline-flex items-center gap-1.5 ${profile.is_published ? "text-accent-mint-dark" : ""}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${profile.is_published ? "bg-accent-mint" : "bg-muted"}`} />
            {profile.is_published ? "Published" : "Draft — not live yet"}
          </span>
          {profile.is_published && (
            <>
              <span className="text-border">·</span>
              <span className="font-mono text-xs">{publicUrl.replace(/^https?:\/\//, "")}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={profile.is_published ? "outline" : "default"}
          onClick={async () => {
            await update.mutateAsync({ is_published: !profile.is_published });
            toast({ title: profile.is_published ? "Profile unpublished" : "Profile published!" });
          }}
          disabled={update.isPending}
        >
          {profile.is_published ? "Unpublish" : "Publish"}
        </Button>
        {profile.is_published && (
          <Button
            variant="outline"
            size="icon"
            title="Copy public link"
            onClick={() => { navigator.clipboard.writeText(publicUrl); toast({ title: "Link copied" }); }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
        <Button asChild variant="ghost" size="icon" title="View public profile">
          <a href={`/u/${profile.slug}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Completion — ring + step-by-step checklist                      */
/* ------------------------------------------------------------------ */

function CompletionSection({ profile }: { profile: FullProfile }) {
  const c = computeCompletion(profile);
  return (
    <section>
      <SectionHeading eyebrow="Step 1" title="Profile completion" />
      <div className="grid md:grid-cols-[200px_1fr] gap-8 border rounded-xl p-6 bg-card">
        <div className="flex items-center justify-center">
          <Ring percent={c.percent} />
        </div>
        <ol className="space-y-1">
          {c.sections.map((s, i) => (
            <li key={s.key}>
              <Link
                to={s.href}
                className="flex items-center justify-between gap-3 py-2 px-3 -mx-3 rounded-lg text-sm transition hover:bg-muted group"
              >
                <span className="flex items-center gap-3 min-w-0">
                  {s.complete
                    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-mint-dark" />
                    : <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />}
                  <span className={s.complete ? "text-muted-foreground line-through" : ""}>
                    <span className="text-muted-foreground/60 font-mono text-xs mr-1.5">{String(i + 1).padStart(2, "0")}</span>
                    {s.label}
                  </span>
                </span>
                {!s.complete && (
                  <span className="text-xs shrink-0 opacity-0 group-hover:opacity-100 transition" style={{ color: "var(--highlightColor)" }}>
                    Add →
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Ring({ percent }: { percent: number }) {
  const r = 64; const c = 2 * Math.PI * r;
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r={r} stroke="hsl(var(--muted-foreground, 0 0% 50%) / 0.2)" strokeWidth="12" fill="none" />
      <circle cx="80" cy="80" r={r} stroke="var(--highlightColor)" strokeWidth="12" fill="none"
        strokeDasharray={c} strokeDashoffset={c - (c * percent) / 100} strokeLinecap="round" transform="rotate(-90 80 80)" />
      <text x="80" y="88" textAnchor="middle" fontSize="28" fontWeight="700" fill="currentColor">{percent}%</text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Content — snapshot of what's actually filled in                 */
/* ------------------------------------------------------------------ */

function ContentSection({ profile }: { profile: FullProfile }) {
  const stage = profile.founder?.stage ? STAGE_LABEL[profile.founder.stage] : null;

  const stats: Array<{ icon: typeof Rocket; label: string; value: string }> = [
    {
      icon: Rocket,
      label: "Building",
      value: profile.founder?.current_venture
        ? `${profile.founder.current_venture}${stage ? ` · ${stage}` : ""}`
        : "Not set yet",
    },
    {
      icon: Route,
      label: "Journey milestones",
      value: `${profile.milestones?.length ?? 0} logged`,
    },
    {
      icon: Sparkles,
      label: "Skills",
      value: profile.skills?.length ? `${profile.skills.length} tagged` : "None yet",
    },
    {
      icon: Briefcase,
      label: "Portfolio items",
      value: `${profile.portfolio?.length ?? 0} added`,
    },
    {
      icon: Handshake,
      label: "Looking for",
      value: profile.looking_for?.length ? `${profile.looking_for.length} selected` : "None yet",
    },
  ];

  return (
    <section>
      <SectionHeading eyebrow="Step 2" title="Your content" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="border rounded-lg p-4 bg-card flex items-start gap-3">
            <div className="h-8 w-8 rounded-md flex items-center justify-center shrink-0" style={{ background: "color-mix(in oklch, var(--highlightColor) 12%, transparent)" }}>
              <Icon className="h-4 w-4" style={{ color: "var(--highlightColor)" }} />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-sm font-medium truncate">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Manage — the four things you can do with your profile           */
/* ------------------------------------------------------------------ */

function ManageSection({ profile }: { profile: FullProfile }) {
  const template = getTemplate(profile.template_id);

  const actions = [
    {
      to: "/app/edit", icon: PenSquare, title: "Edit content",
      description: "All six sections + vision, journey, portfolio.",
    },
    {
      to: "/app/design", icon: Palette, title: "Template & theme",
      description: `Using "${template.name}" · tap to switch or customize.`,
      swatch: profile.theme?.accent,
    },
    {
      to: "/app/export", icon: Download, title: "Export",
      description: "Download your profile as PDF, image, or code.",
    },
  ];

  return (
    <section>
      <SectionHeading eyebrow="Step 4" title="Manage your profile" />
      <div className="grid sm:grid-cols-3 gap-4">
        {actions.map(({ to, icon: Icon, title, description, swatch }) => (
          <Link
            key={to}
            to={to}
            className="border rounded-lg p-5 bg-card hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-md flex items-center justify-center bg-muted">
                <Icon className="h-4 w-4" />
              </div>
              {swatch && <span className="h-4 w-4 rounded-full border" style={{ background: swatch }} />}
            </div>
            <div className="font-medium">{title}</div>
            <div className="text-sm text-muted-foreground mt-1">{description}</div>
          </Link>
        ))}
        <a
          href={`/u/${profile.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="border rounded-lg p-5 bg-card hover:shadow-md hover:-translate-y-0.5 transition-all sm:col-span-3 flex items-center justify-between"
        >
          <div>
            <div className="font-medium">View public profile</div>
            <div className="text-sm text-muted-foreground mt-1">/u/{profile.slug}</div>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
        </a>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1">
        {eyebrow}
      </p>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}
