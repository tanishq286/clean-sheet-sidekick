import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { SKILL_LABEL, LOOKING_LABEL, STAGE_LABEL } from "@/templates/shared/themeStyle";
import type { LookingFor, SkillTag, StartupStage } from "@/types/founder";

/**
 * Public directory of published profiles — read-only by construction.
 *
 * It reads through `list_public_profiles()`, the same anon-callable
 * SECURITY DEFINER function the llms.txt generator uses: only published rows,
 * with contact email and phone stripped. There is no write path on this page,
 * and RLS would refuse one anyway, so browsing can never become editing.
 */

interface DirectoryRow {
  id: string;
  slug: string;
  identity?: { name?: string; headline?: string; location?: string; college?: string };
  founder?: { current_venture?: string; industry?: string; stage?: StartupStage };
  looking_for?: LookingFor[];
}

interface SkillRow {
  profile_id: string;
  tag: SkillTag;
}

export default function Discover() {
  const [query, setQuery] = useState("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["directory"],
    queryFn: async () => {
      const rpc = supabase.rpc as unknown as (
        fn: string,
      ) => Promise<{ data: DirectoryRow[] | null; error: { message: string } | null }>;
      const { data, error } = await rpc("list_public_profiles");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  // Skills are public for published profiles, so one extra read fills the chips.
  const { data: skills = [] } = useQuery({
    queryKey: ["directory-skills"],
    queryFn: async () => {
      const { data } = await supabase.from("skills").select("profile_id, tag");
      return (data ?? []) as SkillRow[];
    },
  });

  const skillsByProfile = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of skills) {
      map.set(s.profile_id, [...(map.get(s.profile_id) ?? []), SKILL_LABEL[s.tag] ?? s.tag]);
    }
    return map;
  }, [skills]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => {
      const hay = [
        p.identity?.name,
        p.identity?.headline,
        p.identity?.college,
        p.identity?.location,
        p.founder?.current_venture,
        p.founder?.industry,
        ...(skillsByProfile.get(p.id) ?? []),
        ...(p.looking_for ?? []).map((l) => LOOKING_LABEL[l] ?? l),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [profiles, query, skillsByProfile]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <header className="mb-8">
          <Link to="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            ← Founder ID
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Discover founders</h1>
          <p className="mt-2 text-muted-foreground">
            Every published profile. Read-only — you can look at anyone, and only you can change yours.
          </p>
        </header>

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, venture, skill, college or what they're looking for…"
          aria-label="Search founders"
          className="mb-6"
        />

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <p className="rounded-xl border p-8 text-center text-muted-foreground">
            {profiles.length === 0
              ? "No published profiles yet. Publish yours and it appears here."
              : `Nothing matches "${query}".`}
          </p>
        ) : (
          <>
            <div className="mb-3 text-sm text-muted-foreground tabular-nums">
              {matches.length} of {profiles.length}
            </div>
            <ul className="space-y-3">
              {matches.map((p) => {
                const tags = skillsByProfile.get(p.id) ?? [];
                const meta = [
                  p.founder?.current_venture,
                  p.founder?.stage ? STAGE_LABEL[p.founder.stage] : null,
                  p.identity?.location,
                ].filter(Boolean);

                return (
                  <li key={p.id}>
                    <Link
                      to={`/u/${p.slug}`}
                      className="block rounded-xl border bg-card p-5 transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-semibold">{p.identity?.name || p.slug}</span>
                        <span className="text-xs text-muted-foreground">/u/{p.slug}</span>
                      </div>

                      {p.identity?.headline && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.identity.headline}</p>
                      )}

                      {meta.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{meta.join(" · ")}</p>}

                      {(tags.length > 0 || (p.looking_for?.length ?? 0) > 0) && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {tags.slice(0, 4).map((t) => (
                            <span key={t} className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                              {t}
                            </span>
                          ))}
                          {(p.looking_for ?? []).slice(0, 3).map((l) => (
                            <span
                              key={l}
                              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                              style={{
                                color: "#FF6B35",
                                backgroundColor: "color-mix(in srgb, #FF6B35 12%, transparent)",
                              }}
                            >
                              Wants: {LOOKING_LABEL[l] ?? l}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
