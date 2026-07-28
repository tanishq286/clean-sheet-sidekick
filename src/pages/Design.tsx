import AppShell from "@/components/AppShell";
import { useMyProfile, useUpdateProfile } from "@/hooks/useProfile";
import { TEMPLATES, getTemplate } from "@/templates/registry";
import { fetchMyProfile } from "@/lib/profile";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import HabitsBlock from "@/templates/shared/HabitsBlock";
import { DEMO_HABITS } from "@/lib/habits";
import ContactSection from "@/components/ContactSection";
import { useState } from "react";

const ACCENTS = ["#FF6B35", "#6BCABA", "#3B82F6", "#A855F7", "#10B981", "#F59E0B", "#EF4444", "#111827"];

export default function Design() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const update = useUpdateProfile();
  const [showContact, setShowContact] = useState(true);
  const [query, setQuery] = useState("");
  const { data: full } = useQuery({
    queryKey: ["full-profile", user?.id, profile?.template_id, profile?.theme],
    queryFn: () => fetchMyProfile(user!.id),
    enabled: !!user && !!profile,
  });

  if (!profile || !full) return <AppShell><div className="p-12 text-muted-foreground">Loading…</div></AppShell>;

  const q = query.trim().toLowerCase();
  const matches = q
    ? TEMPLATES.filter((t) => `${t.name} ${t.description} ${t.family ?? ""}`.toLowerCase().includes(q))
    : TEMPLATES;
  const grouped = [...matches.reduce((map, t) => {
    const key = t.family ?? "Signature";
    map.set(key, [...(map.get(key) ?? []), t]);
    return map;
  }, new Map<string, typeof TEMPLATES>())];

  const Template = getTemplate(profile.template_id).Component;

  return (
    <AppShell>
      <div className="grid lg:grid-cols-[340px_1fr] min-h-[calc(100vh-3.5rem)]">
        <aside className="border-r p-6 space-y-8 overflow-y-auto">
          <div>
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="font-semibold">Template</h2>
              <span className="text-xs text-muted-foreground tabular-nums">{matches.length} of {TEMPLATES.length}</span>
            </div>
            {/* A flat list of 36 is unusable; search + family grouping keeps it
                navigable as more presets are added. */}
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates…"
              aria-label="Search templates"
              className="mb-3"
            />
            {matches.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No template matches "{query}".</p>
            ) : (
              <div className="space-y-5">
                {grouped.map(([family, list]) => (
                  <div key={family}>
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">{family}</div>
                    <div className="space-y-2">
                      {list.map((t) => (
                        <button key={t.id} onClick={async () => { await update.mutateAsync({ template_id: t.id }); toast({ title: `Template: ${t.name}` }); }}
                          aria-pressed={profile.template_id === t.id}
                          className={`w-full text-left border rounded-lg p-3 hover:bg-muted ${profile.template_id === t.id ? "border-foreground" : ""}`}>
                          <div className="font-medium">{t.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-semibold mb-3">Accent color</h2>
            <div className="grid grid-cols-4 gap-2">
              {ACCENTS.map((c) => (
                <button key={c} onClick={async () => { await update.mutateAsync({ theme: { ...profile.theme, accent: c } }); }}
                  className={`h-10 rounded-md border-2 ${profile.theme.accent === c ? "border-foreground" : "border-transparent"}`}
                  style={{ background: c }} />
              ))}
            </div>
            <div className="mt-3">
              <Label>Custom</Label>
              <Input type="color" value={profile.theme.accent} onChange={(e) => update.mutate({ theme: { ...profile.theme, accent: e.target.value } })} />
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-3">Typeface</h2>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: undefined, label: "Match template" },
                { id: "rubik", label: "Sans" },
                { id: "editorial", label: "Editorial" },
                { id: "serif", label: "Serif" },
                { id: "mono", label: "Mono" },
              ] as const).map((f) => (
                <Button
                  key={f.label}
                  size="sm"
                  variant={profile.theme.fontPreset === f.id ? "default" : "outline"}
                  onClick={() => update.mutate({ theme: { ...profile.theme, fontPreset: f.id } })}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Applies to the 30 preset designs. The six signature templates use their own typography.
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-3">Mode</h2>
            <div className="flex gap-2">
              {(["light", "dark"] as const).map((m) => (
                <Button key={m} variant={profile.theme.mode === m ? "default" : "outline"} size="sm"
                  onClick={() => update.mutate({ theme: { ...profile.theme, mode: m } })}>{m}</Button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2">Some templates ignore dark mode.</div>
          </div>

          <div>
            <h2 className="font-semibold mb-3">Contact section</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showContact} onChange={(e) => setShowContact(e.target.checked)} />
              Preview contact form below profile
            </label>
            <div className="text-xs text-muted-foreground mt-2">
              Runs in demo mode here — submissions are simulated so you can test the flow safely.
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-3">Habits</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!profile.theme.display_habits}
                onChange={(e) => update.mutate({ theme: { ...profile.theme, display_habits: e.target.checked } })} />
              Show habits block on public profile
            </label>
            <div className="text-xs text-muted-foreground mt-2">
              Pulls from the Habit Tracker app when connected. Shows demo data here.
            </div>
          </div>
        </aside>

        <div className="overflow-y-auto bg-muted/30">
          <div className="m-6 border rounded-xl overflow-hidden bg-background shadow-sm">
            <Template profile={full} />
            {profile.theme.display_habits && <HabitsBlock slug={profile.slug} demo={DEMO_HABITS} />}
            {showContact && (
              <ContactSection
                name={full.identity?.name}
                email={full.contact?.email}
                slug={profile.slug}
                accent={profile.theme.accent}
                demoMode
              />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}