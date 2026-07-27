import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, Check, Copy, Download, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { FullProfile } from "@/types/founder";
import { computeAeoScore, type ScoreImpact } from "@/lib/geo/score";
import { buildLlmsFullTxt, buildLlmsTxt, downloadText } from "@/lib/geo/llms";
import { buildJsonLdString } from "@/lib/geo/schema";

const IMPACT_STYLES: Record<ScoreImpact, string> = {
  critical: "bg-rose-100 text-rose-700",
  high: "bg-amber-100 text-amber-800",
  medium: "bg-sky-100 text-sky-800",
  low: "bg-neutral-100 text-neutral-600",
};

/**
 * "AI Search Indexing Score" widget for the builder dashboard.
 * Shows GEO/AEO readiness, the highest-impact fixes, and one-click export of
 * the generated llms.txt / llms-full.txt / JSON-LD artifacts.
 */
export default function AeoScoreCard({ profile }: { profile: FullProfile }) {
  const [showAll, setShowAll] = useState(false);
  const result = useMemo(() => computeAeoScore(profile), [profile]);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const ring = 2 * Math.PI * 52;
  const dash = ring - (ring * result.score) / 100;
  const tone =
    result.score >= 90 ? "#10B981" : result.score >= 70 ? "#22C55E" : result.score >= 45 ? "#F59E0B" : "#EF4444";

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copied` });
    } catch {
      toast({ title: "Copy failed", description: "Your browser blocked clipboard access.", variant: "destructive" });
    }
  };

  const visibleChecks = showAll ? result.checks : result.nextActions;

  return (
    <section className="border rounded-xl bg-card overflow-hidden">
      <div className="p-5 border-b flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg grid place-items-center shrink-0" style={{ background: "color-mix(in oklch, var(--highlightColor) 14%, transparent)" }}>
          <Bot className="h-4 w-4" style={{ color: "var(--highlightColor)" }} />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold">AI Search Indexing Score</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            How discoverable your profile is to ChatGPT, Perplexity, Gemini and Google AI Overviews.
          </p>
        </div>
      </div>

      <div className="p-5 grid gap-6 md:grid-cols-[170px_1fr]">
        <div className="flex flex-col items-center justify-center">
          <svg width="130" height="130" viewBox="0 0 130 130" role="img" aria-label={`AI readiness score ${result.score} out of 100`}>
            <circle cx="65" cy="65" r="52" fill="none" strokeWidth="11" className="stroke-muted" />
            <motion.circle
              cx="65" cy="65" r="52" fill="none" stroke={tone} strokeWidth="11" strokeLinecap="round"
              transform="rotate(-90 65 65)"
              strokeDasharray={ring}
              initial={{ strokeDashoffset: ring }}
              animate={{ strokeDashoffset: dash }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
            <text x="65" y="62" textAnchor="middle" fontSize="30" fontWeight="700" fill="currentColor">{result.score}</text>
            <text x="65" y="82" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.55">/ 100</text>
          </svg>
          <div className="mt-2 text-sm font-medium" style={{ color: tone }}>{result.grade}</div>
          <div className="text-xs text-muted-foreground">{result.passedCount}/{result.totalCount} checks passed</div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium">
              {result.nextActions.length === 0 ? "All checks passed" : "Top actions to raise your score"}
            </h3>
            <button onClick={() => setShowAll((v) => !v)} className="text-xs text-muted-foreground hover:text-foreground">
              {showAll ? "Show top actions" : `Show all ${result.checks.length}`}
            </button>
          </div>

          {result.nextActions.length === 0 && !showAll ? (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <Sparkles className="h-4 w-4 shrink-0" />
              Your profile is fully optimized for AI answer engines.
            </div>
          ) : (
            <ul className="space-y-2">
              {visibleChecks.map((c) => (
                <li key={c.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <span className={`mt-0.5 h-5 w-5 rounded-full grid place-items-center shrink-0 ${c.passed ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    {c.passed ? <Check className="h-3 w-3" /> : <TriangleAlert className="h-3 w-3" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${c.passed ? "text-muted-foreground line-through" : ""}`}>{c.label}</span>
                      {!c.passed && (
                        <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${IMPACT_STYLES[c.impact]}`}>{c.impact}</span>
                      )}
                    </div>
                    {!c.passed && (
                      <>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.tip}</p>
                        <Link to={c.href} className="text-xs mt-1.5 inline-block hover:underline" style={{ color: "var(--highlightColor)" }}>
                          Fix this →
                        </Link>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-t bg-muted/30 space-y-3">
        <div>
          <h3 className="text-sm font-medium">AI-readable exports</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generated from your live profile. Structured data is injected automatically on your public page — these files are for hosting at
            <span className="font-mono"> /llms.txt</span> or submitting to AI crawlers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadText("llms.txt", buildLlmsTxt(profile, origin))}>
            <Download className="h-3.5 w-3.5" /> llms.txt
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadText("llms-full.txt", buildLlmsFullTxt(profile, origin))}>
            <Download className="h-3.5 w-3.5" /> llms-full.txt
          </Button>
          <Button size="sm" variant="ghost" onClick={() => copy("llms.txt", buildLlmsTxt(profile, origin))}>
            <Copy className="h-3.5 w-3.5" /> Copy summary
          </Button>
          <Button size="sm" variant="ghost" onClick={() => copy("JSON-LD", buildJsonLdString(profile, origin))}>
            <Copy className="h-3.5 w-3.5" /> Copy JSON-LD
          </Button>
        </div>
      </div>
    </section>
  );
}
