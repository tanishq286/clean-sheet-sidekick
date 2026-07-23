import { useState } from "react";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMyProfile } from "@/hooks/useProfile";
import { useIsVerifiedStudent } from "@/lib/export/gate";
import { buildStaticSite } from "@/lib/export/buildStatic";
import { buildPdf } from "@/lib/export/buildPdf";
import { buildJsonExport } from "@/lib/export/buildJson";
import { buildReactSource } from "@/lib/export/buildReactSource";
import { toast } from "@/hooks/use-toast";
import { Download, FileCode, FileText, FileJson, Boxes, Lock, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

type FormatId = "static" | "pdf" | "json" | "react";

export default function ExportPage() {
  const { data: profile, isLoading } = useMyProfile();
  const { data: verified, isLoading: gateLoading } = useIsVerifiedStudent();
  const [bundleAssets, setBundleAssets] = useState(true);
  const [busy, setBusy] = useState<FormatId | null>(null);

  const run = async (id: FormatId, fn: () => Promise<void>) => {
    setBusy(id);
    try {
      await fn();
      toast({ title: "Download ready", description: "Check your browser downloads." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Export failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  if (isLoading || gateLoading) {
    return <AppShell><div className="p-12 text-muted-foreground">Loading…</div></AppShell>;
  }
  if (!profile) {
    return <AppShell><div className="p-12 text-muted-foreground">No profile yet.</div></AppShell>;
  }

  const locked = !verified;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Export &amp; self-host</h1>
          <p className="text-muted-foreground mt-2">
            Download your portfolio in multiple formats and host it anywhere — Netlify, Vercel, GitHub Pages, your own server.
          </p>
        </div>

        {locked ? (
          <Card className="p-6 border-dashed flex items-start gap-4">
            <Lock className="w-5 h-5 mt-1 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-semibold mb-1">Verified student access required</div>
              <p className="text-sm text-muted-foreground mb-3">
                Exports are available to founders who joined a college using their verified school email
                (e.g. <code>you@yourcollege.edu</code>). Sign in with that address and your access unlocks automatically.
              </p>
              <Button asChild variant="outline" size="sm"><Link to="/app">Back to dashboard</Link></Button>
            </div>
          </Card>
        ) : (
          <Card className="p-4 bg-muted/40 flex items-center gap-3">
            <GraduationCap className="w-5 h-5" style={{ color: "var(--highlightColor)" }} />
            <div className="text-sm">Verified student — exports unlocked.</div>
          </Card>
        )}

        <Card className="p-5 space-y-3">
          <div className="text-sm font-semibold">Asset handling</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className={`border rounded-lg p-3 cursor-pointer ${bundleAssets ? "border-foreground bg-muted/40" : ""}`}>
              <input type="radio" className="mr-2" checked={bundleAssets} onChange={() => setBundleAssets(true)} />
              <span className="font-medium">Bundle into the zip</span>
              <div className="text-xs text-muted-foreground mt-1 ml-5">Fully portable. Larger download. Avatar + portfolio files included.</div>
            </label>
            <label className={`border rounded-lg p-3 cursor-pointer ${!bundleAssets ? "border-foreground bg-muted/40" : ""}`}>
              <input type="radio" className="mr-2" checked={!bundleAssets} onChange={() => setBundleAssets(false)} />
              <span className="font-medium">Sync from the platform</span>
              <div className="text-xs text-muted-foreground mt-1 ml-5">Smaller zip. Uses hosted URLs and the included sync script to pull updates on demand.</div>
            </label>
          </div>
        </Card>

        <div className="grid sm:grid-cols-2 gap-4">
          <ExportCard
            icon={<FileCode className="w-5 h-5" />}
            title="Static HTML/CSS site"
            desc="Self-contained zip with index.html. Drop into any static host — no build step."
            busy={busy === "static"}
            disabled={locked || busy !== null}
            onClick={() => run("static", () => buildStaticSite(profile, { bundleAssets }))}
          />
          <ExportCard
            icon={<FileText className="w-5 h-5" />}
            title="PDF"
            desc="Single printable PDF rendered from your current template."
            busy={busy === "pdf"}
            disabled={locked || busy !== null}
            onClick={() => run("pdf", () => buildPdf(profile))}
          />
          <ExportCard
            icon={<FileJson className="w-5 h-5" />}
            title="JSON data export"
            desc="Backup of every field — identity, ventures, vision, journey, skills, portfolio."
            busy={busy === "json"}
            disabled={locked || busy !== null}
            onClick={() => run("json", async () => buildJsonExport(profile))}
          />
          <ExportCard
            icon={<Boxes className="w-5 h-5" />}
            title="Full React source"
            desc="Vite + React project pre-filled with your data and template. Run npm install & npm run dev locally."
            busy={busy === "react"}
            disabled={locked || busy !== null}
            onClick={() => run("react", () => buildReactSource(profile, { bundleAssets }))}
          />
        </div>
      </div>
    </AppShell>
  );
}

function ExportCard(props: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Card className="p-5 flex flex-col justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 font-semibold mb-1">{props.icon}{props.title}</div>
        <p className="text-sm text-muted-foreground">{props.desc}</p>
      </div>
      <Button onClick={props.onClick} disabled={props.disabled} size="sm">
        <Download className="w-4 h-4 mr-2" />
        {props.busy ? "Preparing…" : "Download"}
      </Button>
    </Card>
  );
}