import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: roles = [] } = useQuery({
    queryKey: ["roles", user?.id],
    queryFn: async () => (await supabase.from("user_roles").select("role").eq("user_id", user!.id)).data ?? [],
    enabled: !!user,
  });
  const isAdmin = roles.some((r: { role: string }) => r.role === "admin");
  const isCollegeAdmin = roles.some((r: { role: string }) => r.role === "admin" || r.role === "college_admin");

  const links = [
    { to: "/", label: "Home", end: false },
    { to: "/app", label: "Dashboard", end: true },
    { to: "/app/edit", label: "Edit", end: false },
    { to: "/app/design", label: "Design", end: false },
    { to: "/app/export", label: "Export", end: false },
    { to: "/discover", label: "Discover", end: false },
    ...(isCollegeAdmin ? [{ to: "/app/college", label: "College", end: false }] : []),
    ...(isAdmin ? [{ to: "/app/admin", label: "Admin", end: false }] : []),
  ];

  const desktopItem = "px-3 py-2 rounded-md text-sm transition hover:bg-muted";
  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link to="/app" className="font-bold shrink-0">
            Founder<span style={{ color: "var(--highlightColor)" }}>ID</span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) => `${desktopItem} ${isActive ? "bg-muted" : ""}`}>
                {l.label}
              </NavLink>
            ))}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign out</Button>
          </nav>

          {/* Mobile menu toggle (44x44 touch target) */}
          <button
            type="button"
            className="md:hidden inline-flex h-11 w-11 -mr-2 items-center justify-center rounded-md hover:bg-muted"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile navigation panel */}
        {open && (
          <nav className="md:hidden border-t bg-background">
            <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex min-h-[44px] items-center rounded-md px-3 text-sm transition ${isActive ? "bg-muted" : "hover:bg-muted"}`}>
                  {l.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={() => { setOpen(false); handleSignOut(); }}
                className="flex min-h-[44px] items-center rounded-md px-3 text-left text-sm transition hover:bg-muted"
              >
                Sign out
              </button>
            </div>
          </nav>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}
