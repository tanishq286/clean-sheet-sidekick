import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { rememberPostAuthRedirect } from "@/lib/authRedirect";

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
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
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
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const google = async () => {
    rememberPostAuthRedirect("/app");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast({ title: "Google sign-in failed", description: String(result.error), variant: "destructive" });
    else if (!result.redirected) navigate("/app");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-md border rounded-xl p-8 bg-card shadow-sm">
        <h1 className="text-2xl font-bold mb-1">
          {mode === "signup" ? "Create your account" : mode === "reset" ? "Reset your password" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "signup" ? "Start building your founder profile." : mode === "reset" ? "We'll email you a reset link." : "Sign in to keep editing."}
        </p>

        {mode !== "reset" && (
          <>
            <Button onClick={google} variant="outline" className="w-full mb-4">Continue with Google</Button>
            <div className="flex items-center gap-2 my-4 text-xs text-muted-foreground"><div className="flex-1 h-px bg-border" />OR<div className="flex-1 h-px bg-border" /></div>
          </>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {mode !== "reset" && (
            <div><Label htmlFor="password">Password</Label><Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "…" : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 text-sm text-center text-muted-foreground space-x-3">
          {mode === "signin" && <>
            <button onClick={() => setMode("signup")} className="hover:underline">New here? Sign up</button>
            <span>·</span>
            <button onClick={() => setMode("reset")} className="hover:underline">Forgot password?</button>
          </>}
          {mode === "signup" && <button onClick={() => setMode("signin")} className="hover:underline">Have an account? Sign in</button>}
          {mode === "reset" && <button onClick={() => setMode("signin")} className="hover:underline">Back to sign in</button>}
        </div>
      </div>
    </div>
  );
}