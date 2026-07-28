import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

/**
 * Permanent account deletion, gated on proving who you are.
 *
 * Typing DELETE stops an accidental tap, but it does nothing against someone
 * sitting at an unlocked, already-signed-in browser. Re-authentication is what
 * actually protects the account, so the destructive call only runs after the
 * identity is re-proved.
 *
 * Two paths, because the app offers two ways in:
 *  - password accounts re-enter their password, verified by signing in again
 *  - Google-only accounts have no password to check, so they retype their
 *    email address exactly. Weaker, but honest — asking for a password that
 *    does not exist would just produce "invalid credentials" and confusion.
 */
export default function DeleteAccount() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);

  // Supabase reports every linked provider here; "email" means a password exists.
  const providers = (user?.app_metadata?.providers as string[] | undefined) ?? [
    user?.app_metadata?.provider as string | undefined,
  ].filter(Boolean) as string[];
  const hasPassword = providers.includes("email");
  const email = user?.email ?? "";

  const typedDelete = confirm.trim().toUpperCase() === "DELETE";
  const identityGiven = hasPassword
    ? secret.length > 0
    : secret.trim().toLowerCase() === email.toLowerCase() && email.length > 0;
  const ready = typedDelete && identityGiven;

  const reauthenticate = async (): Promise<string | null> => {
    if (!hasPassword) {
      return secret.trim().toLowerCase() === email.toLowerCase()
        ? null
        : "That email address doesn't match this account.";
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: secret });
    return error ? "That password isn't right." : null;
  };

  const run = async () => {
    if (!ready || !user) return;
    setBusy(true);
    try {
      const authProblem = await reauthenticate();
      if (authProblem) {
        toast({ title: "Couldn't verify it's you", description: authProblem, variant: "destructive" });
        setBusy(false);
        return;
      }

      // Best effort: a storage failure must not block the deletion itself,
      // otherwise a user could be trapped in an account they asked to remove.
      // It runs first because the RPC cannot reach storage.objects and, once
      // the auth row is gone, there is no session left to clean up with.
      try {
        const { data: files } = await supabase.storage.from("profile-assets").list(user.id);
        if (files?.length) {
          await supabase.storage.from("profile-assets").remove(files.map((f) => `${user.id}/${f.name}`));
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

  const reset = () => {
    setOpen(false);
    setConfirm("");
    setSecret("");
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
        <div className="mt-4 max-w-xs space-y-3">
          <label className="block text-sm">
            {hasPassword ? "Confirm your password" : "Retype your email address"}
            <Input
              type={hasPassword ? "password" : "email"}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={hasPassword ? "Your password" : email}
              autoComplete={hasPassword ? "current-password" : "off"}
              className="mt-1.5"
            />
          </label>

          <label className="block text-sm">
            Type <span className="font-mono font-semibold">DELETE</span> to confirm
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className="mt-1.5"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" size="sm" disabled={!ready || busy} onClick={run}>
              {busy ? "Deleting…" : "Permanently delete"}
            </Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={reset}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
