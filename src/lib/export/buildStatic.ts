import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { getTemplate } from "@/templates/registry";
import type { FullProfile } from "@/types/founder";
import { collectAssets, rewriteProfileUrls } from "./assets";

function wrapHtml(body: string, title: string, description: string, accent: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<script src="https://cdn.tailwindcss.com?plugins=typography"></script>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Fraunces:wght@400;500;700&family=Instrument+Serif&family=JetBrains+Mono:wght@400;500&family=Rubik:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
<style>
  :root { --accent: ${accent}; --highlightColor: ${accent}; }
  body { font-family: 'Rubik', ui-sans-serif, system-ui, sans-serif; }
  .font-serif { font-family: 'Fraunces', 'Instrument Serif', Georgia, serif !important; }
  .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace !important; }
  .font-display { font-family: 'Archivo Black', sans-serif !important; }
  @media print { .no-print { display: none !important; } }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export async function buildStaticSite(profile: FullProfile, opts: { bundleAssets: boolean }) {
  const zip = new JSZip();
  let exported = profile;

  if (opts.bundleAssets) {
    const { assets, urlMap } = await collectAssets(profile);
    exported = rewriteProfileUrls(profile, urlMap);
    assets.forEach((a) => zip.file(a.localPath, a.blob));
  }

  const Template = getTemplate(profile.template_id).Component;
  const body = renderToStaticMarkup(createElement(Template, { profile: exported }));
  const html = wrapHtml(
    body,
    `${profile.identity?.name ?? "Founder"} — Portfolio`,
    profile.identity?.bio ?? "",
    profile.theme?.accent ?? "#FF6B35",
  );
  zip.file("index.html", html);
  zip.file(
    "README.md",
    `# ${profile.identity?.name ?? "Founder"} — Portfolio (static export)\n\n` +
      `Open \`index.html\` in any browser, or drop this folder into any static host:\n\n` +
      `- Netlify Drop: https://app.netlify.com/drop\n- Vercel: \`vercel --prod\`\n- GitHub Pages\n- Cloudflare Pages\n\n` +
      `Generated on ${new Date().toISOString()} by FounderID.\n`,
  );

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${profile.slug}-portfolio-static.zip`);
}