import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  MIN_PASSWORD_LENGTH,
  isPasswordReady,
  visiblePasswordProblem,
} from "@/lib/password";

/**
 * Change your password from inside the app, without the reset-email round trip.
 *
 * Two shapes, because there are two kinds of account:
 *
 *  - **Password accounts** change it in place. The current password is
 *    required — an unlocked, already-signed-in browser must not be enough to
 *    lock the real owner out. Supabase has no "verify this password" endpoint,
 *    so signing in again is the check; that also refreshes the session, which
 *    is what Supabase wants before accepting a password change.
 *
 *  - **Google-only accounts** have no password to verify, so there is nothing
 *    honest to check a typed one against. Instead of a weak in-page prompt they
 *    get a link emailed to them, which proves control of the inbox and lands on
 *    the existing /reset-password screen. Setting one is worth offering: it
 *    means Google going down doesn't lock a founder out of their own profile.
 */
export default function ChangePassword() {
  const { user } = useAuth();

  // Supabase lists every linked provider here; "email" means a password exists.
  const providers = (user?.app_metadata?.providers as string[] | undefined) ?? [
    user?.app_metadata?.provider as string | undefined,
  ].filter(Boolean) as string[];
  const hasPassword = providers.includes("email");
  const email = user?.email ?? "";

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const draft = { next, confirm, current };
  const problem = visiblePasswordProblem(draft);
  const ready = current.length > 0 && isPasswordReady(draft);

  const reset = () => {
    setOpen(false);
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    try {
      const { error: wrongPassword } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (wrongPassword) {
        toast({
          title: "That current password isn't right",
          description: "Check it and try again.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Use the new one the next time you sign in.",
      });
      reset();
    } catch (err) {
      toast({
        title: "Couldn't update your password",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const emailSetupLink = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Link sent", description: `Check ${email} to finish setting a password.` });
    } catch (err) {
      toast({
        title: "Couldn't send the link",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Google-only: offer to set one, verified by email                  */
  /* ---------------------------------------------------------------- */
  if (!hasPassword) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold">Set a password</h3>
        <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
          You sign in with Google, so there's no password on this account yet. Adding one gives
          you a second way in — useful if you ever lose access to{" "}
          {email ? <span className="font-mono text-xs">{email}</span> : "your Google account"}.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          disabled={busy || sent || !email}
          onClick={emailSetupLink}
        >
          {busy ? "Sending…" : sent ? "Link sent — check your inbox" : "Email me a link"}
        </Button>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Password account: change it in place                              */
  /* ---------------------------------------------------------------- */
  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="font-semibold">Change password</h3>
      <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
        Update it whenever you like. You'll stay signed in here; anywhere else you're signed in
        will need the new password.
      </p>

      {!open ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setOpen(true)}>
          Change password
        </Button>
      ) : (
        <form onSubmit={submit} className="mt-4 max-w-xs space-y-3">
          {/* Helps password managers attach the update to the right account. */}
          <input type="hidden" name="username" autoComplete="username" value={email} readOnly />

          <label className="block text-sm">
            Current password
            <Input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Current password"
              autoComplete="current-password"
              className="mt-1.5"
            />
          </label>

          <label className="block text-sm">
            New password
            <Input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              autoComplete="new-password"
              className="mt-1.5"
            />
          </label>

          <label className="block text-sm">
            Confirm new password
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat it"
              autoComplete="new-password"
              className="mt-1.5"
            />
          </label>

          {problem && (
            <p role="alert" className="text-sm text-destructive">
              {problem}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={!ready || busy}>
              {busy ? "Updating…" : "Update password"}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={reset}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
