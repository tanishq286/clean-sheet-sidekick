import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { computeCompletion } from "@/lib/completion";
import { Link, Navigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function CollegeAdmin() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [editDraft, setEditDraft] = useState({ name: "", slug: "", domain: "" });

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", user?.id],
    queryFn: async () => (await supabase.from("user_roles").select("role").eq("user_id", user!.id)).data ?? [],
    enabled: !!user,
  });
  const isAdmin = roles.some((r: any) => r.role === "admin");
  const isCollegeAdmin = roles.some((r: any) => r.role === "college_admin" || r.role === "admin");

  const { data: colleges = [] } = useQuery({
    queryKey: ["colleges"],
    queryFn: async () => (await supabase.from("colleges").select("*").order("name")).data ?? [],
    enabled: isCollegeAdmin,
  });

  const activeCollegeId = selectedCollege ?? colleges[0]?.id ?? null;
  const activeCollege = colleges.find((c: any) => c.id === activeCollegeId) ?? null;

  const { data: members = [] } = useQuery({
    queryKey: ["college-members", activeCollegeId],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("college_members").select("*").eq("college_id", activeCollegeId!);
      if (!rows?.length) return [];
      const ids = rows.map((r: any) => r.user_id);
      const [{ data: profiles }, { data: skills }, { data: ms }, { data: pf }] = await Promise.all([
        supabase.from("profiles").select("*").in("id", ids),
        supabase.from("skills").select("*").in("profile_id", ids),
        supabase.from("journey_milestones").select("*").in("profile_id", ids),
        supabase.from("portfolio_items").select("*").in("profile_id", ids),
      ]);
      return rows.map((r: any) => {
        const p = profiles?.find((x: any) => x.id === r.user_id);
        if (!p) return { ...r, profile: null, completion: 0 };
        const full: any = {
          ...p,
          skills: skills?.filter((s: any) => s.profile_id === r.user_id) ?? [],
          milestones: ms?.filter((m: any) => m.profile_id === r.user_id) ?? [],
          portfolio: pf?.filter((x: any) => x.profile_id === r.user_id) ?? [],
        };
        return { ...r, profile: full, completion: computeCompletion(full).percent };
      });
    },
    enabled: !!activeCollegeId,
  });

  const avgCompletion = useMemo(() => {
    if (!members.length) return 0;
    return Math.round(members.reduce((s: number, m: any) => s + (m.completion ?? 0), 0) / members.length);
  }, [members]);

  const [newCollege, setNewCollege] = useState({ name: "", slug: "", domain: "" });
  const createCollege = async () => {
    if (!newCollege.name || !newCollege.slug) return toast({ title: "Name and slug required", variant: "destructive" });
    const { error } = await supabase.from("colleges").insert({
      name: newCollege.name,
      slug: newCollege.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      domain: newCollege.domain || null,
      created_by: user!.id,
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setNewCollege({ name: "", slug: "", domain: "" });
    toast({ title: "College created" });
    qc.invalidateQueries({ queryKey: ["colleges"] });
  };

  const [inviteEmail, setInviteEmail] = useState("");
  const invite = async () => {
    if (!activeCollegeId || !inviteEmail) return;
    const { data: uid, error: lookupErr } = await supabase.rpc("find_user_by_email", { _email: inviteEmail });
    if (lookupErr) return toast({ title: "Lookup failed", description: lookupErr.message, variant: "destructive" });
    if (!uid) return toast({ title: "No account with that email yet", variant: "destructive" });
    const { error } = await supabase.from("college_members").insert({
      college_id: activeCollegeId, user_id: uid, role: "student",
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setInviteEmail("");
    toast({ title: "Member added" });
    qc.invalidateQueries({ queryKey: ["college-members", activeCollegeId] });
  };

  const removeMember = async (id: string) => {
    await supabase.from("college_members").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["college-members", activeCollegeId] });
  };

  const startEdit = () => {
    if (!activeCollege) return;
    setEditDraft({ name: activeCollege.name ?? "", slug: activeCollege.slug ?? "", domain: activeCollege.domain ?? "" });
    setEditing(true);
  };
  const saveEdit = async () => {
    if (!activeCollegeId) return;
    if (!editDraft.name || !editDraft.slug) return toast({ title: "Name and slug required", variant: "destructive" });
    const { error } = await supabase.from("colleges").update({
      name: editDraft.name,
      slug: editDraft.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      domain: editDraft.domain || null,
    }).eq("id", activeCollegeId);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    toast({ title: "College updated" });
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["colleges"] });
  };
  const deleteCollege = async () => {
    if (!activeCollegeId || !activeCollege) return;
    if (!confirm(`Delete "${activeCollege.name}"? This removes all member assignments for this college.`)) return;
    await supabase.from("college_members").delete().eq("college_id", activeCollegeId);
    const { error } = await supabase.from("colleges").delete().eq("id", activeCollegeId);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "College deleted" });
    setSelectedCollege(null);
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["colleges"] });
  };

  if (loading || rolesLoading) return <AppShell><div className="p-12 text-muted-foreground">Loading…</div></AppShell>;
  if (!isCollegeAdmin) return <Navigate to="/app" replace />;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="text-3xl font-bold">College admin</h1>
          <p className="text-muted-foreground mt-1">Manage cohorts, invite founders, and track profile completion.</p>
        </div>

        {isAdmin && (
            <section className="border rounded-lg p-5 space-y-3">
              <h2 className="font-semibold">Create a college</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <div><Label>Name</Label><Input value={newCollege.name} onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })} placeholder="IIT Bombay" /></div>
                <div><Label>Slug</Label><Input value={newCollege.slug} onChange={(e) => setNewCollege({ ...newCollege, slug: e.target.value })} placeholder="iitb" /></div>
                <div>
                  <Label>Email domain (optional)</Label>
                  <Input value={newCollege.domain} onChange={(e) => setNewCollege({ ...newCollege, domain: e.target.value })} placeholder="iitb.ac.in" />
                  <p className="text-xs text-muted-foreground mt-1">Verified users with a matching email automatically join as students.</p>
                </div>
              </div>
              <Button onClick={createCollege}>Create</Button>
            </section>
        )}

        {colleges.length === 0 ? (
          <div className="text-muted-foreground border rounded-lg p-8 text-center">No colleges yet.</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {colleges.map((c: any) => (
                <button key={c.id} onClick={() => setSelectedCollege(c.id)}
                  className={`px-4 py-2 rounded-md border text-sm ${activeCollegeId === c.id ? "bg-foreground text-background" : ""}`}>
                  {c.name}
                </button>
              ))}
            </div>

            <section className="grid sm:grid-cols-3 gap-4">
              <Stat label="Members" value={members.length} />
              <Stat label="Avg. completion" value={`${avgCompletion}%`} />
              <Stat label="Published" value={members.filter((m: any) => m.profile?.is_published).length} />
            </section>

            {activeCollege && (
              <section className="border rounded-lg p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">College details</h2>
                    <p className="text-xs text-muted-foreground mt-1">Slug: <span className="font-mono">{activeCollege.slug}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setDetailsOpen((v) => !v)} aria-label={detailsOpen ? "Collapse details" : "Expand details"}>
                      {detailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                    {isAdmin && !editing && (
                      <>
                        <Button variant="outline" size="sm" onClick={startEdit}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={deleteCollege}>Delete</Button>
                      </>
                    )}
                  </div>
                </div>
                {detailsOpen && (
                  editing ? (
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div><Label>Name</Label><Input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} /></div>
                        <div><Label>Slug</Label><Input value={editDraft.slug} onChange={(e) => setEditDraft({ ...editDraft, slug: e.target.value })} /></div>
                        <div>
                          <Label>Email domain</Label>
                          <Input value={editDraft.domain} onChange={(e) => setEditDraft({ ...editDraft, domain: e.target.value })} placeholder="optional" />
                          <p className="text-xs text-muted-foreground mt-1">Verified users with a matching email automatically join as students.</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveEdit}>Save</Button>
                        <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <dl className="grid sm:grid-cols-3 gap-4 text-sm">
                      <div><dt className="text-xs uppercase tracking-wide text-muted-foreground">Name</dt><dd className="mt-1">{activeCollege.name}</dd></div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email domain</dt>
                        <dd className="mt-1">{activeCollege.domain || "—"}</dd>
                        {activeCollege.domain && <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Auto-join enabled</span>}
                      </div>
                      <div><dt className="text-xs uppercase tracking-wide text-muted-foreground">Created</dt><dd className="mt-1">{activeCollege.created_at ? new Date(activeCollege.created_at).toLocaleDateString() : "—"}</dd></div>
                    </dl>
                  )
                )}
              </section>
            )}

            <section className="border rounded-lg p-5 space-y-3">
              <h2 className="font-semibold">Invite a founder</h2>
              <div className="flex gap-2">
                <Input type="email" placeholder="founder@email.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                <Button onClick={invite}>Add</Button>
              </div>
              <p className="text-xs text-muted-foreground">They must already have a FounderID account.</p>
            </section>

            <section className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3">Founder</th>
                    <th className="px-4 py-3">Venture</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Completion</th>
                    <th className="px-4 py-3">Published</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m: any) => (
                    <tr key={m.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="font-medium">{m.profile?.identity?.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{m.profile?.slug}</div>
                      </td>
                      <td className="px-4 py-3">{m.profile?.founder?.current_venture || "—"}</td>
                      <td className="px-4 py-3 capitalize">{m.profile?.founder?.stage || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded bg-muted overflow-hidden">
                            <div className="h-full bg-foreground" style={{ width: `${m.completion}%` }} />
                          </div>
                          <span className="text-xs tabular-nums">{m.completion}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{m.profile?.is_published ? "✓" : "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {m.profile?.is_published && (
                          <Link to={`/u/${m.profile.slug}`} className="text-xs underline mr-3" target="_blank">View</Link>
                        )}
                        <button className="text-xs text-muted-foreground hover:text-destructive" onClick={() => removeMember(m.id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No members yet.</td></tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="border rounded-lg p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}