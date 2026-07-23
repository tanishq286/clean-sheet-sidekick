import JSZip from "jszip";
import { saveAs } from "file-saver";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { getTemplate } from "@/templates/registry";
import type { FullProfile } from "@/types/founder";
import { collectAssets, rewriteProfileUrls } from "./assets";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

function pkgJson(slug: string) {
  return JSON.stringify(
    {
      name: `${slug}-portfolio`,
      private: true,
      version: "1.0.0",
      type: "module",
      scripts: { dev: "vite", build: "vite build", preview: "vite preview", sync: "node sync.mjs" },
      dependencies: { react: "^18.3.1", "react-dom": "^18.3.1" },
      devDependencies: {
        vite: "^5.4.10",
        "@vitejs/plugin-react": "^4.3.3",
        typescript: "^5.5.3",
        "@types/react": "^18.3.12",
        "@types/react-dom": "^18.3.1",
      },
    },
    null,
    2,
  );
}

const VITE_CFG = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins: [react()] });
`;

const TS_CFG = JSON.stringify(
  {
    compilerOptions: {
      target: "ES2020", lib: ["ES2020", "DOM", "DOM.Iterable"], jsx: "react-jsx",
      module: "ESNext", moduleResolution: "Bundler", strict: false,
      esModuleInterop: true, skipLibCheck: true, resolveJsonModule: true, isolatedModules: true,
    },
    include: ["src"],
  },
  null,
  2,
);

const INDEX_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>__TITLE__</title>
<meta name="description" content="__DESC__" />
<script src="https://cdn.tailwindcss.com?plugins=typography"></script>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Fraunces:wght@400;500;700&family=Instrument+Serif&family=JetBrains+Mono:wght@400;500&family=Rubik:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
<style>
  :root { --accent: __ACCENT__; --highlightColor: __ACCENT__; }
  body { font-family: 'Rubik', ui-sans-serif, system-ui, sans-serif; margin: 0; }
  .font-serif { font-family: 'Fraunces', 'Instrument Serif', Georgia, serif !important; }
  .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace !important; }
  .font-display { font-family: 'Archivo Black', sans-serif !important; }
</style>
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
</body>
</html>`;

const MAIN_TSX = `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
createRoot(document.getElementById("root")!).render(<App />);
`;

const APP_TSX = `import React, { useEffect, useState } from "react";
import profileData from "./profile.json";
import portfolioHtml from "./portfolio.html?raw";

export default function App() {
  const [html, setHtml] = useState(portfolioHtml);
  const [profile] = useState(profileData.profile);

  // Optional: live-sync from FounderID on mount when ?sync=1
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("sync")) return;
    import("./sync.mjs").then((m) => m.syncFromFounderId(profile.slug).then((fresh) => {
      if (fresh?.html) setHtml(fresh.html);
    }));
  }, [profile.slug]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
`;

function syncScript(supabaseUrl: string, anonKey: string) {
  return `// Re-fetch the latest published profile from FounderID.
// Usage:  node sync.mjs <slug>
// Or import in the browser:  import { syncFromFounderId } from "./sync.mjs"
const URL = ${JSON.stringify(supabaseUrl)};
const KEY = ${JSON.stringify(anonKey)};

export async function syncFromFounderId(slug) {
  const headers = { apikey: KEY, Authorization: "Bearer " + KEY };
  const profileRes = await fetch(URL + "/rest/v1/profiles?select=*&slug=eq." + encodeURIComponent(slug) + "&is_published=eq.true", { headers });
  const [profile] = await profileRes.json();
  if (!profile) throw new Error("Profile not found or not published");
  const [skills, milestones, portfolio] = await Promise.all([
    fetch(URL + "/rest/v1/skills?profile_id=eq." + profile.id, { headers }).then((r) => r.json()),
    fetch(URL + "/rest/v1/journey_milestones?profile_id=eq." + profile.id + "&order=order_index", { headers }).then((r) => r.json()),
    fetch(URL + "/rest/v1/portfolio_items?profile_id=eq." + profile.id + "&order=order_index", { headers }).then((r) => r.json()),
  ]);
  return { profile: { ...profile, skills, milestones, portfolio } };
}

// CLI mode
if (import.meta.url === ("file://" + (globalThis.process?.argv?.[1] ?? ""))) {
  const slug = globalThis.process.argv[2];
  if (!slug) { console.error("usage: node sync.mjs <slug>"); globalThis.process.exit(1); }
  syncFromFounderId(slug).then((data) => {
    globalThis.console.log(JSON.stringify(data, null, 2));
  }).catch((e) => { globalThis.console.error(e); globalThis.process.exit(1); });
}
`;
}

function readme(profile: FullProfile, bundled: boolean) {
  return `# ${profile.identity?.name ?? "Founder"} — Portfolio (React source)

This is your portfolio exported from **FounderID** as a Vite + React project.

## Run locally

\`\`\`bash
npm install
npm run dev
\`\`\`

Then open the URL Vite prints (usually http://localhost:5173).

## Build for production

\`\`\`bash
npm run build
npm run preview
\`\`\`

The build output in \`dist/\` is fully static — drop it on Netlify, Vercel, GitHub Pages, Cloudflare Pages, S3, etc.

## Files

- \`src/App.tsx\` — root component. Renders \`portfolio.html\` and reads \`profile.json\`.
- \`src/portfolio.html\` — pre-rendered HTML of your chosen template (\`${profile.template_id}\`).
- \`src/profile.json\` — your structured profile data. Edit freely.
- \`assets/\` — ${bundled ? "your uploaded images & files, bundled into the project." : "no bundled assets — your portfolio still points at the hosted URLs on FounderID."}
- \`sync.mjs\` — fetch the latest published version of your profile from FounderID at any time.

## Re-sync from FounderID

Whenever you update your profile on FounderID and want to refresh this copy:

\`\`\`bash
npm run sync ${profile.slug} > src/profile.json
\`\`\`

Or open \`http://localhost:5173/?sync=1\` to live-sync in the browser.

Exported on ${new Date().toISOString()}.
`;
}

function wrapBodyHtml(body: string) {
  return body;
}

export async function buildReactSource(profile: FullProfile, opts: { bundleAssets: boolean }) {
  const zip = new JSZip();
  let exported = profile;

  if (opts.bundleAssets) {
    const { assets, urlMap } = await collectAssets(profile);
    exported = rewriteProfileUrls(profile, urlMap);
    assets.forEach((a) => zip.file(a.localPath, a.blob));
  }

  const Template = getTemplate(profile.template_id).Component;
  const body = renderToStaticMarkup(createElement(Template, { profile: exported }));

  const title = `${profile.identity?.name ?? "Founder"} — Portfolio`;
  const desc = profile.identity?.bio ?? "";
  const accent = profile.theme?.accent ?? "#FF6B35";

  // Pull live anon key/url from this app so sync.mjs works against the same backend
  const supabaseUrl = SUPABASE_URL ?? (supabase as any).supabaseUrl ?? "";
  const supabaseKey = SUPABASE_ANON_KEY ?? "";

  zip.file("package.json", pkgJson(profile.slug));
  zip.file("vite.config.ts", VITE_CFG);
  zip.file("tsconfig.json", TS_CFG);
  zip.file(
    "index.html",
    INDEX_HTML.replace("__TITLE__", title).replace("__DESC__", desc).replace(/__ACCENT__/g, accent),
  );
  zip.file("src/main.tsx", MAIN_TSX);
  zip.file("src/App.tsx", APP_TSX);
  zip.file("src/portfolio.html", wrapBodyHtml(body));
  zip.file(
    "src/profile.json",
    JSON.stringify({ version: 1, exported_at: new Date().toISOString(), profile: exported }, null, 2),
  );
  zip.file("sync.mjs", syncScript(supabaseUrl, supabaseKey));
  zip.file("README.md", readme(profile, opts.bundleAssets));
  zip.file(
    ".gitignore",
    `node_modules\ndist\n.DS_Store\n`,
  );

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${profile.slug}-portfolio-source.zip`);
}