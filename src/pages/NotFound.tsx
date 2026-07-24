import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Link to="/" className="mb-10 inline-flex items-center gap-2">
        <span className="h-6 w-6 rounded-md bg-accent-mint" />
        <span className="text-lg font-semibold tracking-tight">
          Founder <span className="text-[#FF6B35]">ID</span>
        </span>
      </Link>

      <p className="mb-4 font-['JetBrains_Mono'] text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Error 404
      </p>
      <h1 className="font-['Archivo_Black'] text-6xl leading-[0.95] tracking-tight text-foreground sm:text-8xl">
        Lost the <span className="text-[#FF6B35]">thread</span>.
      </h1>
      <p className="mt-5 max-w-md text-muted-foreground">
        This page doesn&apos;t exist, or the profile hasn&apos;t been published yet.
        Let&apos;s get you back on track.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/app">Go to your profile</Link>
        </Button>
      </div>
    </main>
  );
};

export default NotFound;
