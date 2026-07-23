import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-[80dvh] place-items-center px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-700">
          <Compass className="size-7" />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">404</h1>
          <p className="text-sm text-muted-foreground">
            That page slipped past the back line. Let&apos;s get you back to the dashboard.
          </p>
        </div>
        <Button asChild>
          <Link href="/">Back to matrix</Link>
        </Button>
      </div>
    </div>
  );
}
