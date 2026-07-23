import { Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { useMyProfile, useUpdateProfile } from "@/hooks/useProfile";
import { computeCompletion } from "@/lib/completion";
import { publicProfileUrl } from "@/lib/subdomain";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { data: profile, isLoading } = useMyProfile();
  const update = useUpdateProfile();

  if (isLoading) return <AppShell><div className="p-12 text-muted-foreground">Loading…</div></AppShell>;
  if (!profile) return <AppShell><div className="p-12">No profile found.</div></AppShell>;

  const c = computeCompletion(profile);
  const publicUrl = publicProfileUrl(profile.slug);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Hi{profile.identity?.name ? `, ${profile.identity.name.split(" ")[0]}` : ""}.</h1>
            <p className="text-muted-foreground mt-1">Your founder profile in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={profile.is_published ? "outline" : "default"}
              onClick={async () => {
                await update.mutateAsync({ is_published: !profile.is_published });
                toast({ title: profile.is_published ? "Profile unpublished" : "Profile published!" });
              }}
            >
              {profile.is_published ? "Unpublish" : "Publish"}
            </Button>
            {profile.is_published && (
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(publicUrl); toast({ title: "Link copied" }); }}>Copy link</Button>
            )}
            <Button asChild variant="ghost"><a href={`/u/${profile.slug}`} target="_blank" rel="noreferrer">View profile</a></Button>
          </div>
        </div>

        <div className="grid md:grid-cols-[200px_1fr] gap-8 border rounded-xl p-6 bg-card">
          <div className="flex items-center justify-center">
            <Ring percent={c.percent} />
          </div>
          <div>
            <div className="text-lg font-medium mb-3">Profile completion</div>
            <ul className="space-y-2">
              {c.sections.map((s) => (
                <li key={s.key} className="flex items-center justify-between text-sm">
                  <span className={s.complete ? "text-muted-foreground line-through" : ""}>{s.label}</span>
                  {!s.complete && <Link to={s.href} className="text-xs underline" style={{ color: "var(--highlightColor)" }}>Add →</Link>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Link to="/app/edit" className="border rounded-lg p-5 hover:shadow-md transition"><div className="font-medium">Edit content</div><div className="text-sm text-muted-foreground mt-1">All six sections + vision, journey, portfolio.</div></Link>
          <Link to="/app/design" className="border rounded-lg p-5 hover:shadow-md transition"><div className="font-medium">Template &amp; theme</div><div className="text-sm text-muted-foreground mt-1">Pick a template, set accent color, preview live.</div></Link>
          <a href={`/u/${profile.slug}`} target="_blank" rel="noreferrer" className="border rounded-lg p-5 hover:shadow-md transition"><div className="font-medium">View public profile</div><div className="text-sm text-muted-foreground mt-1">/u/{profile.slug}</div></a>
        </div>
      </div>
    </AppShell>
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