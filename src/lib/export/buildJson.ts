import { saveAs } from "file-saver";
import type { FullProfile } from "@/types/founder";

export function buildJsonExport(profile: FullProfile) {
  const payload = {
    version: 1,
    exported_at: new Date().toISOString(),
    source: "founderid",
    profile,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  saveAs(blob, `${profile.slug}-portfolio.json`);
}