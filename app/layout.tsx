import type { Metadata, Viewport } from "next";
import { Providers } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Clean Sheet Sidekick · FPL defensive fixture intelligence",
    template: "%s · Clean Sheet Sidekick",
  },
  description:
    "A pitch-dark Fantasy Premier League dashboard that forecasts clean-sheet probabilities across upcoming gameweeks, with an odds overlay and a defender rotation planner.",
  applicationName: "Clean Sheet Sidekick",
  keywords: ["FPL", "Fantasy Premier League", "clean sheet", "defenders", "fixtures", "rotation"],
  authors: [{ name: "Clean Sheet Sidekick" }],
  openGraph: {
    title: "Clean Sheet Sidekick",
    description: "Forecast FPL clean sheets before everyone else.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0f0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
