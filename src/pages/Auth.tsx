import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { rememberPostAuthRedirect } from "@/lib/authRedirect";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export default function Auth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const hasOAuthParams = typeof window !== "undefined" && (
    /[#&?](access_token|refresh_token|code|error)=/.test(window.location.hash) ||
    /[?&](access_token|refresh_token|code|error)=/.test(window.location.search)
  );

  if (hasOAuthParams) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-muted-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        Finishing sign-in…
      </div>
    );
  }

  if (user) return <Navigate to="/app" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        rememberPostAuthRedirect("/app");
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        toast({ title: "Account created", description: "Check your email to confirm, then sign in." });
        setMode("signin");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/app", { replace: true });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast({ title: "Reset email sent", description: "Check your inbox." });
        setMode("signin");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const google = async () => {
    rememberPostAuthRedirect("/app");
    // Supabase-native Google OAuth (portable to any host, incl. Netlify).
    // Redirects the browser to Google; on return, /auth/callback completes the
    // session handoff via hydrateSessionFromRedirectUrl.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
    }
  };

  const heading = mode === "signup" ? "Create your account" : mode === "reset" ? "Reset your password" : "Welcome back";
  const subheading = mode === "signup"
    ? "Start building your founder profile."
    : mode === "reset"
      ? "We'll email you a reset link."
      : "Sign in to keep editing.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link to="/" className="mb-8 inline-flex items-center gap-2">
        <span className="h-6 w-6 rounded-md bg-accent-mint" />
        <span className="text-lg font-semibold tracking-tight">
          Founder <span className="text-[#FF6B35]">ID</span>
        </span>
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] backdrop-blur-sm">
        <h1 className="font-['Archivo_Black'] text-3xl tracking-tight">{heading}</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">{subheading}</p>

        {mode !== "reset" && (
          <>
            <Button onClick={google} variant="outline" className="w-full">
              <GoogleIcon />
              Continue with Google
            </Button>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />OR<div className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          {mode !== "reset" && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait…" : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 space-x-3 text-center text-sm text-muted-foreground">
          {mode === "signin" && <>
            <button onClick={() => setMode("signup")} className="transition-colors hover:text-foreground">New here? Sign up</button>
            <span>·</span>
            <button onClick={() => setMode("reset")} className="transition-colors hover:text-foreground">Forgot password?</button>
          </>}
          {mode === "signup" && <button onClick={() => setMode("signin")} className="transition-colors hover:text-foreground">Have an account? Sign in</button>}
          {mode === "reset" && <button onClick={() => setMode("signin")} className="transition-colors hover:text-foreground">Back to sign in</button>}
        </div>
      </div>

      <Link to="/" className="mt-6 text-sm text-muted-foreground transition-colors hover:text-foreground">
        ← Back to home
      </Link>
    </div>
  );
}
