import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  RELATIONSHIP_LABEL, RELATIONSHIP_BLURB, requestCoSign,
  type CoSignRelationship,
} from "@/lib/cosign";

export interface CoSignProject {
  id: string;
  title: string;
}

const RELATIONSHIPS: CoSignRelationship[] = ["contributor", "client", "verified_peer"];
const NOTE_LIMIT = 280;

/**
 * Vouch for someone else's project.
 *
 * Three steps: which project, what the relationship was, and an optional note.
 * The project step exists because this opens from the profile's network
 * section rather than from a single card — the 36 templates render portfolio
 * items differently, so one entry point that names the project explicitly is
 * more reliable than a button injected into every layout.
 *
 * Nothing here is trusted by the database. The insert policy re-derives the
 * project's real owner and rejects anything that disagrees, so a tampered
 * client can file a request that fails, never one that lands somewhere it
 * shouldn't.
 */
export default function CoSignModal({
  open, onClose, targetUserId, targetName, projects,
}: {
  open: boolean;
  onClose: () => void;
  targetUserId: string;
  targetName: string;
  projects: CoSignProject[];
}) {
  const { user } = useAuth();
  const reduce = useReducedMotion();

  const [projectId, setProjectId] = useState<string | null>(projects[0]?.id ?? null);
  const [relationship, setRelationship] = useState<CoSignRelationship | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => {
    if (busy) return;
    onClose();
    setRelationship(null);
    setNote("");
  };

  const submit = async () => {
    if (!user || !projectId || !relationship) return;
    setBusy(true);
    try {
      await requestCoSign({
        portfolioItemId: projectId,
        targetUserId,
        cosignerUserId: user.id,
        relationship,
        note,
      });
      toast({
        title: "Co-sign sent",
        description: `${targetName} will see it on their dashboard. It appears publicly once they accept.`,
      });
      close();
    } catch (err) {
      toast({
        title: "Couldn't send that co-sign",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Co-sign ${targetName}'s work`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            // text-foreground is load-bearing: a fixed element still inherits
            // colour from its ancestor, and on the dark templates that made
            // the dialog render near-white text on a near-white surface.
            className="relative w-full max-w-lg overflow-hidden rounded-t-2xl border border-white/15 bg-background/85 text-foreground shadow-2xl backdrop-blur-xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "color-mix(in srgb, #FF6B35 15%, transparent)" }}
                >
                  <ShieldCheck className="h-4.5 w-4.5" style={{ color: "#FF6B35" }} />
                </span>
                <div>
                  <h2 className="font-semibold leading-tight">Co-sign {targetName}&apos;s work</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Vouch for something you were actually part of.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
              {!user ? (
                <div className="rounded-lg border p-4 text-sm">
                  <p className="text-muted-foreground">
                    You need an account to co-sign — it&apos;s what makes the endorsement mean
                    something.
                  </p>
                  <Button asChild size="sm" className="mt-3">
                    <a href="/auth">Sign in to co-sign</a>
                  </Button>
                </div>
              ) : projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {targetName} hasn&apos;t published any projects to co-sign yet.
                </p>
              ) : (
                <>
                  <fieldset>
                    <legend className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      1 · Which project
                    </legend>
                    <div className="space-y-1.5">
                      {projects.map((p) => (
                        <label
                          key={p.id}
                          className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-sm transition ${
                            projectId === p.id ? "border-foreground/40 bg-muted/60" : "hover:bg-muted/40"
                          }`}
                        >
                          <input
                            type="radio"
                            name="cosign-project"
                            className="accent-current"
                            checked={projectId === p.id}
                            onChange={() => setProjectId(p.id)}
                          />
                          <span className="min-w-0 truncate">{p.title}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      2 · How you know it
                    </legend>
                    <div className="grid gap-1.5 sm:grid-cols-3">
                      {RELATIONSHIPS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRelationship(r)}
                          aria-pressed={relationship === r}
                          className={`rounded-lg border p-3 text-left transition ${
                            relationship === r ? "border-foreground/40 bg-muted/60" : "hover:bg-muted/40"
                          }`}
                        >
                          <span className="block text-sm font-medium">{RELATIONSHIP_LABEL[r]}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {RELATIONSHIP_BLURB[r]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div>
                    <label
                      htmlFor="cosign-note"
                      className="mb-2 block text-xs font-medium uppercase tracking-widest text-muted-foreground"
                    >
                      3 · Add a note <span className="normal-case tracking-normal">(optional)</span>
                    </label>
                    <textarea
                      id="cosign-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value.slice(0, NOTE_LIMIT))}
                      rows={3}
                      placeholder="What did they actually do? One or two specifics beat a paragraph of praise."
                      className="w-full resize-none rounded-lg border bg-background/60 p-3 text-sm outline-none transition focus:border-foreground/40"
                    />
                    <div className="mt-1 text-right text-xs tabular-nums text-muted-foreground">
                      {note.length}/{NOTE_LIMIT}
                    </div>
                  </div>
                </>
              )}
            </div>

            {user && projects.length > 0 && (
              <div className="flex items-center justify-between gap-3 border-t border-white/10 p-5">
                <p className="text-xs text-muted-foreground">
                  Shown publicly only after {targetName} accepts.
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={close} disabled={busy}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => void submit()} disabled={!projectId || !relationship || busy}>
                    {busy ? "Sending…" : (<><Check className="mr-1.5 h-3.5 w-3.5" />Send co-sign</>)}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
