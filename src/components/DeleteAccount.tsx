import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

/**
 * Permanent account deletion.
 *
 * Deliberately high-friction: collapsed by default, and the button stays
 * disabled until the exact word is typed. This is the only irreversible action
 * in the product, so a stray tap must not be able to reach it.
 *
 * Order matters. Stored files are removed first, because Postgres refuses
 * direct deletes from storage.objects and the RPC therefore cannot reach them
 * — once the auth row is gone the client has no session left to clean up with,
 * and the assets would be orphaned forever.
 */
export default function DeleteAccount() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const ready = confirm.trim().toUpperCase() === "DELETE";

  const run = async () => {
    if (!ready || !user) return;
    setBusy(true);
    try {
      // Best effort: a storage failure must not block the deletion itself,
      // otherwise a user could be trapped in an account they asked to remove.
      try {
        const { data: files } = await supabase.storage.from("profile-assets").list(user.id);
        if (files?.length) {
          await supabase.storage
            .from("profile-assets")
            .remove(files.map((f) => `${user.id}/${f.name}`));
        }
      } catch {
        /* orphaned assets are recoverable; a blocked deletion is not */
      }

      const rpc = supabase.rpc as unknown as (fn: string) => Promise<{ error: { message: string } | null }>;
      const { error } = await rpc("delete_my_account");
      if (error) throw new Error(error.message);

      await signOut();
      toast({ title: "Account deleted", description: "Everything has been removed. Sorry to see you go." });
      navigate("/");
    } catch (e) {
      toast({
        title: "Couldn't delete account",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/[0.03] p-6">
      <h3 className="font-semibold text-destructive">Delete account</h3>
      <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
        Permanently removes your profile, journey, portfolio, skills, uploaded images and view
        history. Your public link stops working immediately. This cannot be undone.
      </p>

      {!open ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setOpen(true)}>
          Delete my account
        </Button>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            Type <span className="font-mono font-semibold">DELETE</span> to confirm
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className="mt-1.5 max-w-xs"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" size="sm" disabled={!ready || busy} onClick={run}>
              {busy ? "Deleting…" : "Permanently delete"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setConfirm("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
