import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AppShell from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Counter from "@/components/Counter";

/**
 * Platform administration.
 *
 * Every query and mutation here goes through a SECURITY DEFINER RPC that
 * re-checks the caller's admin role server-side. The role gate below only
 * decides what to *draw* — it is not what protects the data, so a non-admin
 * who reaches this URL gets an empty screen and failing RPCs rather than
 * someone else's records.
 */

interface AdminProfile {
  id: string;
  slug: string;
  name: string;
  email: string;
  is_published: boolean;
  template_id: string;
  views: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface Overview {
  total_users: number;
  total_profiles: number;
  published_profiles: number;
  draft_profiles: number;
  total_views: number;
  views_7d: number;
  total_colleges: number;
  signups_7d: number;
}

const rpc = <T,>(fn: string, args?: Record<string, unknown>) =>
  (supabase.rpc as unknown as (f: string, a?: Record<string, unknown>) => Promise<{ data: T; error: { message: string } | null }>)(
    fn,
    args,
  );

export default function AdminDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");

  const { data: roles = [] } = useQuery({
    queryKey: ["roles", user?.id],
    queryFn: async () => (await supabase.from("user_roles").select("role").eq("user_id", user!.id)).data ?? [],
    enabled: !!user,
  });
  const isAdmin = roles.some((r: { role: string }) => r.role === "admin");

  const { data: overview } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const { data, error } = await rpc<Overview[] | Overview>("admin_overview");
      if (error) throw new Error(error.message);
      return (Array.isArray(data) ? data[0] : data) as Overview;
    },
    enabled: isAdmin,
  });

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await rpc<AdminProfile[]>("admin_list_profiles");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => `${p.name} ${p.slug} ${p.email}`.toLowerCase().includes(q));
  }, [profiles, query]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-profiles"] });
    qc.invalidateQueries({ queryKey: ["admin-overview"] });
  };

  const act = async (label: string, fn: string, args: Record<string, unknown>) => {
    const { error } = await rpc(fn, args);
    if (error) toast({ title: label + " failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: label });
      refresh();
    }
  };

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-6 py-20 text-center">
          <h1 className="text-2xl font-semibold">Admin only</h1>
          <p className="mt-2 text-muted-foreground">
            This account doesn&apos;t have the admin role. Ask an existing admin to grant it.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/app">Back to dashboard</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const stats: { label: string; value: number; hint?: string }[] = overview
    ? [
        { label: "Accounts", value: overview.total_users, hint: `${overview.signups_7d} new this week` },
        { label: "Published", value: overview.published_profiles, hint: `${overview.draft_profiles} drafts` },
        { label: "Profile views", value: overview.total_views, hint: `${overview.views_7d} this week` },
        { label: "Colleges", value: overview.total_colleges, hint: "verification domains" },
      ]
    : [];

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Platform</div>
            <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            Refresh
          </Button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-5">
              <div className="text-3xl font-semibold tabular-nums">
                <Counter value={s.value} />
              </div>
              <div className="mt-1 text-sm font-medium">{s.label}</div>
              {s.hint && <div className="mt-0.5 text-xs text-muted-foreground">{s.hint}</div>}
            </div>
          ))}
        </div>

        <section className="rounded-xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <h2 className="font-semibold">
              People{" "}
              <span className="text-sm font-normal text-muted-foreground tabular-nums">
                {matches.length} of {profiles.length}
              </span>
            </h2>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, slug or email…"
              aria-label="Search people"
              className="max-w-xs"
            />
          </div>

          {isLoading ? (
            <div className="p-6 text-muted-foreground">Loading…</div>
          ) : matches.length === 0 ? (
            <div className="p-6 text-muted-foreground">No accounts match &ldquo;{query}&rdquo;.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-3 font-medium">Person</th>
                    <th className="p-3 font-medium">Template</th>
                    <th className="p-3 font-medium text-right">Views</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 align-top">
                      <td className="p-3">
                        <div className="font-medium">
                          {p.name}
                          {p.is_admin && (
                            <span
                              className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                              style={{ backgroundColor: "color-mix(in srgb, var(--accent, #FF6B35) 15%, transparent)", color: "var(--accent, #FF6B35)" }}
                            >
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{p.email}</div>
                        <div className="text-xs text-muted-foreground">/u/{p.slug}</div>
                      </td>
                      <td className="p-3 text-muted-foreground">{p.template_id}</td>
                      <td className="p-3 text-right tabular-nums">{p.views}</td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            p.is_published ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {p.is_published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              act(
                                p.is_published ? "Unpublished" : "Published",
                                "admin_set_published",
                                { _profile_id: p.id, _published: !p.is_published },
                              )
                            }
                          >
                            {p.is_published ? "Unpublish" : "Publish"}
                          </Button>
                          {p.is_published && (
                            <Button size="sm" variant="ghost" asChild>
                              <a href={`/u/${p.slug}`} target="_blank" rel="noopener noreferrer">
                                View ↗
                              </a>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            // The RPC refuses to strip your own admin role; without
                            // that guard an admin could lock every screen here.
                            disabled={p.id === user?.id && p.is_admin}
                            onClick={() =>
                              act(p.is_admin ? "Admin removed" : "Admin granted", "admin_set_role", {
                                _user_id: p.id,
                                _role: "admin",
                                _grant: !p.is_admin,
                              })
                            }
                          >
                            {p.is_admin ? "Revoke admin" : "Make admin"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-xs text-muted-foreground">
          Every action here runs through a server-side role check. Publishing or unpublishing someone
          else&apos;s profile changes what the public sees immediately.
        </p>
      </div>
    </AppShell>
  );
}
