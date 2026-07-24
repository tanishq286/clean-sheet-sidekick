import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const item = "px-3 py-2 rounded-md text-sm hover:bg-muted transition";
  const { data: roles = [] } = useQuery({
    queryKey: ["roles", user?.id],
    queryFn: async () => (await supabase.from("user_roles").select("role").eq("user_id", user!.id)).data ?? [],
    enabled: !!user,
  });
  const isAdmin = roles.some((r: { role: string }) => r.role === "admin" || r.role === "college_admin");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/app" className="font-bold">Founder<span style={{ color: "var(--highlightColor)" }}>ID</span></Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/" className={item}>Home</NavLink>
            <NavLink to="/app" end className={({ isActive }) => `${item} ${isActive ? "bg-muted" : ""}`}>Dashboard</NavLink>
            <NavLink to="/app/edit" className={({ isActive }) => `${item} ${isActive ? "bg-muted" : ""}`}>Edit</NavLink>
            <NavLink to="/app/design" className={({ isActive }) => `${item} ${isActive ? "bg-muted" : ""}`}>Design</NavLink>
            <NavLink to="/app/export" className={({ isActive }) => `${item} ${isActive ? "bg-muted" : ""}`}>Export</NavLink>
            {isAdmin && (
              <NavLink to="/app/college" className={({ isActive }) => `${item} ${isActive ? "bg-muted" : ""}`}>College</NavLink>
            )}
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>Sign out</Button>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}