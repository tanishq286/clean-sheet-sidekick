import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { rememberPostAuthRedirect } from "@/lib/authRedirect";
import heroArt from "@/assets/landing-hero.jpg";

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen text-foreground" style={{ background: "oklch(98% 0.01 80)" }}>
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="inline-block w-6 h-6 rounded-sm" style={{ background: "#6BCABA" }} />
          Founder<span style={{ color: "#FF6B35" }}>ID</span>
        </div>
        <nav className="flex gap-3">
          {user ? (
            <Button asChild><Link to="/app">Open dashboard</Link></Button>
          ) : (
            <>
              <Button variant="ghost" asChild><Link to="/auth" onClick={() => rememberPostAuthRedirect("/app")}>Log in</Link></Button>
              <Button asChild><Link to="/auth" onClick={() => rememberPostAuthRedirect("/app")}>Get started</Link></Button>
            </>
          )}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-12 pb-24">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] mb-6 text-muted-foreground">Founder Identity · for entrepreneurs &amp; student founders</div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.02]">
              A founder profile <span style={{ color: "#FF6B35" }}>investors and mentors</span> can actually read.
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-xl">
              Six questions. Four templates. One link to share with the people deciding whether to back you, mentor you, or build with you.
            </p>
            <div className="mt-8 flex gap-3">
              <Button size="lg" asChild><Link to="/auth" onClick={() => rememberPostAuthRedirect("/app")}>Start your profile</Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/style-guide">See the style guide</Link></Button>
            </div>
          </div>
          <div className="relative">
            <img src={heroArt} alt="Founder identity built from layered cards" width={1280} height={1280}
              className="w-full rounded-xl border shadow-sm" />
            <div className="absolute -bottom-4 -left-4 bg-background border rounded-lg px-3 py-2 text-xs shadow-sm">
              <span className="font-semibold" style={{ color: "#6BCABA" }}>● Published</span> · founderid.app/u/your-name
            </div>
          </div>
        </div>

        <section className="mt-24 grid md:grid-cols-3 gap-6">
          {[
            { n: "01", t: "Six questions", d: "Who you are. What you're building. What you've done. What you can do. What you need. How to work with you." },
            { n: "02", t: "Four templates", d: "Resume, Editorial, Minimal, Dossier — same content, very different looks. Switch any time." },
            { n: "03", t: "One link", d: "Publish at /u/your-slug today. Move to your-slug.founderid.app whenever you're ready." },
          ].map((c) => (
            <div key={c.t} className="border rounded-xl p-6 bg-card">
              <div className="text-xs font-mono mb-3 text-muted-foreground">{c.n}</div>
              <div className="font-semibold mb-2">{c.t}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.d}</p>
            </div>
          ))}
        </section>

        <section className="mt-24 border-t pt-12">
          <div className="grid md:grid-cols-2 gap-8 items-end">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built for the way founders actually get found.</h2>
              <p className="mt-4 text-muted-foreground">A LinkedIn for builders. A pitch deck that fits in a URL. An identity that grows with you from Idea to Scaling.</p>
            </div>
            <ul className="space-y-2 text-sm">
              {["Idea","Validation","MVP","Revenue","Profitable","Funded","Scaling"].map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground w-6">{String(i+1).padStart(2,"0")}</span>
                  <span className="font-medium">{s}</span>
                  <span className="flex-1 h-px bg-border" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-muted-foreground flex justify-between">
          <div>© FounderID</div>
          <div className="flex gap-4">
            <Link to="/auth" className="hover:text-foreground">Sign in</Link>
            <Link to="/style-guide" className="hover:text-foreground">Style guide</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}