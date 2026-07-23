import { ReactNode } from "react";
import BackToTop from "./BackToTop";
import Footer from "./Footer";
import SkipLink from "./SkipLink";
import { useAnimatedBackground } from "@/hooks/useAnimatedBackground";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  // Enable animated background
  useAnimatedBackground();

  return (
    <div className="min-h-screen bg-background snap-y snap-mandatory overflow-y-scroll">
      <SkipLink />
      <main id="main-content">{children}</main>
      <Footer />
      <BackToTop />
    </div>
  );
}
