import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useMyProfile, useUpdateProfile } from "@/hooks/useProfile";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { uploadAsset } from "@/lib/profile";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  SKILL_TAGS, LOOKING_FOR_OPTIONS, PORTFOLIO_KINDS, STARTUP_STAGES,
  type SkillTag, type LookingFor, type Venture,
  type Milestone, type PortfolioItem,
} from "@/types/founder";
import { SKILL_LABEL, LOOKING_LABEL, PORTFOLIO_LABEL } from "@/templates/shared/themeStyle";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function EditProfile() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const update = useUpdateProfile();
  const qc = useQueryClient();

  const [draft, setDraft] = useState<any>(null);
  useEffect(() => { if (profile && !draft) setDraft(profile); }, [profile, draft]);

  if (!profile || !draft) return <AppShell><div className="p-12 text-muted-foreground">Loading…</div></AppShell>;

  const set = (path: string, value: any) => setDraft((d: any) => ({ ...d, [path]: value }));
  const setIn = (group: string, key: string, value: any) =>
    setDraft((d: any) => ({ ...d, [group]: { ...d[group], [key]: value } }));

  const save = async () => {
    await update.mutateAsync({
      slug: draft.slug,
      identity: draft.identity, founder: draft.founder, vision: draft.vision,
      contact: draft.contact, looking_for: draft.looking_for,
    });
    toast({ title: "Saved" });
  };

  // Ventures predate having an id, so backfill one for any legacy row. Without
  // a stable key React re-keys this list by position: removing a venture makes
  // it reuse the surviving DOM nodes in place, and the inputs below the removed
  // row end up showing the previous row's text.
  const additional: Venture[] = (draft.founder.additional_ventures ?? []).map((v, i) => ({
    ...v,
    id: v.id ?? `venture-legacy-${i}`,
  }));
  const setVentures = (list: Venture[]) => setIn("founder", "additional_ventures", list);
  const updateVenture = (id: string, patch: Partial<Venture>) =>
    setVentures(additional.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  const removeVenture = (id: string) => setVentures(additional.filter((v) => v.id !== id));

  const newVentureId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `venture-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const toggleLooking = (l: LookingFor) => {
    const list: LookingFor[] = draft.looking_for ?? [];
    set("looking_for", list.includes(l) ? list.filter((x) => x !== l) : [...list, l]);
  };

  const handlePhoto = async (file: File) => {
    try {
      const url = await uploadAsset(user!.id, file, "avatar");
      setIn("identity", "photo_url", url);
      toast({ title: "Photo uploaded" });
    } catch (e: any) { toast({ title: "Upload failed", description: e.message, variant: "destructive" }); }
  };
  const handleCover = async (file: File) => {
    try {
      const url = await uploadAsset(user!.id, file, "cover");
      setIn("identity", "cover_url", url);
      toast({ title: "Cover uploaded" });
    } catch (e: any) { toast({ title: "Upload failed", description: e.message, variant: "destructive" }); }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Edit your profile</h1>
          <Button onClick={save} disabled={update.isPending}>{update.isPending ? "Saving…" : "Save"}</Button>
        </div>

        <Section id="identity" title="1. Who are you?">
          <Field label="Name"><Input value={draft.identity.name ?? ""} onChange={(e) => setIn("identity", "name", e.target.value)} /></Field>
          <Field label="Headline (one line, shown under your name)">
            <Input value={draft.identity.headline ?? ""} onChange={(e) => setIn("identity", "headline", e.target.value)} placeholder="Founder · Building X · Stanford '26" />
          </Field>
          <Field label="Bio (1–3 sentences)"><Textarea rows={3} value={draft.identity.bio ?? ""} onChange={(e) => setIn("identity", "bio", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Location"><Input value={draft.identity.location ?? ""} onChange={(e) => setIn("identity", "location", e.target.value)} /></Field>
            <Field label="College"><Input value={draft.identity.college ?? ""} onChange={(e) => setIn("identity", "college", e.target.value)} /></Field>
          </div>
          <Field label="Graduation"><Input value={draft.identity.graduation ?? ""} onChange={(e) => setIn("identity", "graduation", e.target.value)} placeholder="2026" /></Field>
          <Field label="Photo">
            <div className="flex items-center gap-3">
              {draft.identity.photo_url && <img src={draft.identity.photo_url} alt="Profile photo preview" className="w-16 h-16 rounded-full object-cover" />}
              <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
            </div>
          </Field>
          <Field label="Cover / background image (LinkedIn-style banner)">
            <div className="space-y-2">
              {draft.identity.cover_url && <img src={draft.identity.cover_url} alt="Cover image preview" className="w-full h-32 object-cover rounded-md border" />}
              <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleCover(e.target.files[0])} />
            </div>
          </Field>
          <Field label="Profile URL slug">
            <Input value={draft.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
            <div className="text-xs text-muted-foreground mt-1">{window.location.origin}/u/{draft.slug}</div>
          </Field>
        </Section>

        <Section id="founder" title="2. What are you building?">
          <Field label="Current venture"><Input value={draft.founder.current_venture ?? ""} onChange={(e) => setIn("founder", "current_venture", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Industry"><Input value={draft.founder.industry ?? ""} onChange={(e) => setIn("founder", "industry", e.target.value)} placeholder="EdTech, Climate, AI…" /></Field>
            <Field label="Stage">
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.founder.stage ?? ""} onChange={(e) => setIn("founder", "stage", e.target.value)}>
                <option value="">Select…</option>
                {STARTUP_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Problem statement"><Textarea rows={3} value={draft.founder.problem ?? ""} onChange={(e) => setIn("founder", "problem", e.target.value)} /></Field>
          <Field label="Mission (one line)"><Input value={draft.founder.mission ?? ""} onChange={(e) => setIn("founder", "mission", e.target.value)} /></Field>

          {additional.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Additional ventures</div>
              {additional.map((v) => (
                <div key={v.id} className="border rounded-lg p-4 space-y-3 relative">
                  <button type="button" aria-label="Remove venture"
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                    onClick={() => removeVenture(v.id!)}>×</button>
                  <Field label="Venture name"><Input value={v.name ?? ""} onChange={(e) => updateVenture(v.id!, { name: e.target.value })} /></Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Industry"><Input value={v.industry ?? ""} onChange={(e) => updateVenture(v.id!, { industry: e.target.value })} /></Field>
                    <Field label="Stage">
                      <select className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        value={v.stage ?? ""} onChange={(e) => updateVenture(v.id!, { stage: e.target.value as any })}>
                        <option value="">Select…</option>
                        {STARTUP_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Problem"><Textarea rows={2} value={v.problem ?? ""} onChange={(e) => updateVenture(v.id!, { problem: e.target.value })} /></Field>
                  <Field label="Mission"><Input value={v.mission ?? ""} onChange={(e) => updateVenture(v.id!, { mission: e.target.value })} /></Field>
                </div>
              ))}
            </div>
          )}

          <Button type="button" variant="outline" size="sm"
            onClick={() => setVentures([...additional, { id: newVentureId(), name: "", industry: "", stage: undefined, problem: "", mission: "" }])}>
            + Add another venture
          </Button>
        </Section>

        <Section id="vision" title="Vision">
          <Field label="What problem are you trying to solve?"><Textarea rows={3} value={draft.vision.problem_solving ?? ""} onChange={(e) => setIn("vision", "problem_solving", e.target.value)} /></Field>
          <Field label="Why does this problem matter to you?"><Textarea rows={3} value={draft.vision.why_it_matters ?? ""} onChange={(e) => setIn("vision", "why_it_matters", e.target.value)} /></Field>
        </Section>

        <Section id="journey" title="3. What have you done? (Journey)">
          <JourneyEditor profileId={profile.id} />
        </Section>

        <Section id="skills" title="4. What can you do? (Skills)">
          <SkillsEditor profileId={profile.id} />
        </Section>

        <Section id="looking" title="5. What do you need?">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LOOKING_FOR_OPTIONS.map((l) => {
              const on = (draft.looking_for ?? []).includes(l);
              return (
                <button type="button" key={l} onClick={() => toggleLooking(l)}
                  className={`px-3 py-2 rounded-md border text-sm text-left ${on ? "border-foreground bg-muted" : ""}`}
                  style={on ? { borderColor: "var(--highlightColor)" } : undefined}>
                  {on ? "☑" : "☐"} {LOOKING_LABEL[l]}
                </button>
              );
            })}
          </div>
        </Section>

        <Section id="portfolio" title="Portfolio">
          <PortfolioEditor profileId={profile.id} />
        </Section>

        <Section id="contact" title="6. How can someone work with you?">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Email"><Input type="email" value={draft.contact.email ?? ""} onChange={(e) => setIn("contact", "email", e.target.value)} /></Field>
            <Field label="Phone"><Input value={draft.contact.phone ?? ""} onChange={(e) => setIn("contact", "phone", e.target.value)} /></Field>
            <Field label="Website"><Input value={draft.identity.website ?? ""} onChange={(e) => setIn("identity", "website", e.target.value)} placeholder="https://…" /></Field>
            <Field label="LinkedIn"><Input value={draft.identity.linkedin ?? ""} onChange={(e) => setIn("identity", "linkedin", e.target.value)} placeholder="https://linkedin.com/in/…" /></Field>
            <Field label="Twitter / X"><Input value={draft.contact.twitter ?? ""} onChange={(e) => setIn("contact", "twitter", e.target.value)} /></Field>
          </div>
        </Section>

        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={save} disabled={update.isPending} size="lg">{update.isPending ? "Saving…" : "Save all changes"}</Button>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-4 scroll-mt-20">
      <h2 className="text-xl font-semibold border-b pb-2">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label>{children}</div>;
}

// ===== Journey editor =====
// Local state is the source of truth so typing is instant; changes persist to
// Supabase on blur (not on every keystroke), which fixes the frozen inputs.
function JourneyEditor({ profileId }: { profileId: string }) {
  const qc = useQueryClient();
  const { data: loaded } = useQuery({
    queryKey: ["journey", profileId],
    queryFn: async () =>
      ((await supabase.from("journey_milestones").select("*").eq("profile_id", profileId).order("order_index")).data ??
        []) as unknown as Milestone[],
  });
  const [items, setItems] = useState<Milestone[] | null>(null);
  useEffect(() => { if (loaded && items === null) setItems(loaded); }, [loaded, items]);
  const list = items ?? [];

  const patchLocal = (id: string, patch: Partial<Milestone>) =>
    setItems((cur) => (cur ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const persist = async (id: string, patch: Partial<Milestone>) => {
    const { error } = await supabase.from("journey_milestones").update(patch as never).eq("id", id);
    if (error) toast({ title: "Couldn't save milestone", description: error.message, variant: "destructive" });
    else qc.invalidateQueries({ queryKey: ["my-profile"] });
  };

  const addItem = async () => {
    const { data, error } = await supabase.from("journey_milestones")
      .insert({ profile_id: profileId, year: new Date().getFullYear().toString(), title: "New milestone", order_index: list.length } as never)
      .select().single();
    if (error || !data) { toast({ title: "Couldn't add milestone", variant: "destructive" }); return; }
    setItems((cur) => [...(cur ?? []), data as unknown as Milestone]);
    qc.invalidateQueries({ queryKey: ["my-profile"] });
  };

  const removeItem = async (id: string) => {
    setItems((cur) => (cur ?? []).filter((m) => m.id !== id));
    await supabase.from("journey_milestones").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-profile"] });
  };

  return (
    <div className="space-y-3">
      {list.map((m) => (
        <div key={m.id} className="grid grid-cols-[80px_1fr_1fr_auto] gap-2 items-start">
          <Input value={m.year ?? ""} placeholder="Year"
            onChange={(e) => patchLocal(m.id, { year: e.target.value })}
            onBlur={(e) => persist(m.id, { year: e.target.value })} />
          <Input value={m.title ?? ""} placeholder="Title"
            onChange={(e) => patchLocal(m.id, { title: e.target.value })}
            onBlur={(e) => persist(m.id, { title: e.target.value })} />
          <Input value={m.description ?? ""} placeholder="Description"
            onChange={(e) => patchLocal(m.id, { description: e.target.value })}
            onBlur={(e) => persist(m.id, { description: e.target.value })} />
          <Button variant="ghost" onClick={() => removeItem(m.id)} aria-label="Remove milestone">×</Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>+ Add milestone</Button>
    </div>
  );
}

// ===== Skills editor =====
// Optimistic local toggle so the chips respond instantly, then persist.
function SkillsEditor({ profileId }: { profileId: string }) {
  const qc = useQueryClient();
  const { data: loaded } = useQuery({
    queryKey: ["skills", profileId],
    queryFn: async () =>
      ((await supabase.from("skills").select("tag").eq("profile_id", profileId)).data ?? []) as { tag: SkillTag }[],
  });
  const [active, setActive] = useState<SkillTag[] | null>(null);
  useEffect(() => { if (loaded && active === null) setActive(loaded.map((s) => s.tag)); }, [loaded, active]);
  const tags = active ?? [];
  const has = (tag: SkillTag) => tags.includes(tag);

  const toggle = async (tag: SkillTag) => {
    const isOn = has(tag);
    setActive(isOn ? tags.filter((t) => t !== tag) : [...tags, tag]);
    if (isOn) await supabase.from("skills").delete().eq("profile_id", profileId).eq("tag", tag);
    else await supabase.from("skills").insert({ profile_id: profileId, tag } as never);
    qc.invalidateQueries({ queryKey: ["my-profile"] });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {SKILL_TAGS.map((tag) => (
        <button key={tag} type="button" onClick={() => toggle(tag)}
          aria-pressed={has(tag)}
          className={`px-3 py-1 rounded-full border text-sm transition-colors ${has(tag) ? "bg-foreground text-background" : "hover:bg-muted"}`}>
          {SKILL_LABEL[tag]}
        </button>
      ))}
    </div>
  );
}

// ===== Portfolio editor =====
// Same pattern as Journey: instant local edits, persist on blur / selection.
function PortfolioEditor({ profileId }: { profileId: string }) {
  const qc = useQueryClient();
  const { data: loaded } = useQuery({
    queryKey: ["portfolio", profileId],
    queryFn: async () =>
      ((await supabase.from("portfolio_items").select("*").eq("profile_id", profileId).order("order_index")).data ??
        []) as unknown as PortfolioItem[],
  });
  const [items, setItems] = useState<PortfolioItem[] | null>(null);
  useEffect(() => { if (loaded && items === null) setItems(loaded); }, [loaded, items]);
  const list = items ?? [];

  const patchLocal = (id: string, patch: Partial<PortfolioItem>) =>
    setItems((cur) => (cur ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const persist = async (id: string, patch: Partial<PortfolioItem>) => {
    const { error } = await supabase.from("portfolio_items").update(patch as never).eq("id", id);
    if (error) toast({ title: "Couldn't save item", description: error.message, variant: "destructive" });
    else qc.invalidateQueries({ queryKey: ["my-profile"] });
  };

  const addItem = async () => {
    const { data, error } = await supabase.from("portfolio_items")
      .insert({ profile_id: profileId, kind: "website", title: "New item", order_index: list.length } as never)
      .select().single();
    if (error || !data) { toast({ title: "Couldn't add item", variant: "destructive" }); return; }
    setItems((cur) => [...(cur ?? []), data as unknown as PortfolioItem]);
    qc.invalidateQueries({ queryKey: ["my-profile"] });
  };

  const removeItem = async (id: string) => {
    setItems((cur) => (cur ?? []).filter((p) => p.id !== id));
    await supabase.from("portfolio_items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-profile"] });
  };

  return (
    <div className="space-y-3">
      {list.map((p) => (
        <div key={p.id} className="border rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-[160px_1fr_auto] gap-2">
            <select className="h-10 rounded-md border bg-background px-2 text-sm" value={p.kind}
              onChange={(e) => { patchLocal(p.id, { kind: e.target.value as PortfolioItem["kind"] }); persist(p.id, { kind: e.target.value as PortfolioItem["kind"] }); }}>
              {PORTFOLIO_KINDS.map((k) => <option key={k} value={k}>{PORTFOLIO_LABEL[k]}</option>)}
            </select>
            <Input value={p.title ?? ""} placeholder="Title"
              onChange={(e) => patchLocal(p.id, { title: e.target.value })}
              onBlur={(e) => persist(p.id, { title: e.target.value })} />
            <Button variant="ghost" onClick={() => removeItem(p.id)} aria-label="Remove item">×</Button>
          </div>
          <Input value={p.url ?? ""} placeholder="https://… (optional)"
            onChange={(e) => patchLocal(p.id, { url: e.target.value })}
            onBlur={(e) => persist(p.id, { url: e.target.value })} />
          <Textarea rows={2} value={p.description ?? ""} placeholder="Description"
            onChange={(e) => patchLocal(p.id, { description: e.target.value })}
            onBlur={(e) => persist(p.id, { description: e.target.value })} />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addItem}>+ Add portfolio item</Button>
    </div>
  );
}