import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { consumePostAuthRedirect, hydrateSessionFromRedirectUrl } from "@/lib/authRedirect";
import { supabase } from "@/integrations/supabase/client";

const waitForConfirmedSession = async () => {
  const hydratedSession = await hydrateSessionFromRedirectUrl();
  if (hydratedSession) return hydratedSession;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session;
    await new Promise((resolve) => window.setTimeout(resolve, 200));
  }

  return null;
};

export default function AuthCallback() {
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    waitForConfirmedSession()
      .then((session) => {
        if (cancelled) return;
        navigate(session ? consumePostAuthRedirect() : "/auth", { replace: true });
      })
      .catch((error) => {
        console.error("OAuth callback failed", error);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-md border rounded-xl p-8 bg-card shadow-sm text-center">
        <h1 className="text-2xl font-bold mb-2">{failed ? "Sign-in needs another try" : "Finishing sign-in…"}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {failed ? "The browser did not complete the session handoff." : "Please wait while we open your dashboard."}
        </p>
        {failed && <Button onClick={() => navigate("/auth", { replace: true })}>Back to sign in</Button>}
      </div>
    </div>
  );
}