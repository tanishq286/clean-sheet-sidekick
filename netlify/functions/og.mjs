/**
 * Dynamic OpenGraph image generator — zero cost, runs on Netlify Functions.
 *
 *   GET /api/og?name=Jane%20Doe&role=Founder%2C%20Routely&title=Logistics&theme=%23FF6B35
 *   -> 1200x630 PNG
 *
 * Pipeline: satori (layout -> SVG) -> @resvg/resvg-wasm (SVG -> PNG).
 *
 * Two deliberate choices for serverless reliability:
 *  - The layout is built with plain object trees instead of JSX, so the
 *    function needs no JSX transform in the bundler.
 *  - Fonts and the wasm binary are cached in module scope, so only the first
 *    invocation after a cold start pays for them. Combined with the long CDN
 *    cache headers below, real execution-seconds usage stays near zero.
 */

import satori from "satori";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const WIDTH = 1200;
const HEIGHT = 630;
const DEFAULT_ACCENT = "#FF6B35";
const MINT = "#6BCABA";

let fontsPromise = null;
let wasmPromise = null;

/** Inter from the Google Fonts CDN, as ArrayBuffers satori can consume. */
function loadFonts() {
  if (fontsPromise) return fontsPromise;
  const grab = async (weight) => {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&display=swap`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; FounderID-OG/1.0)" } },
    ).then((r) => r.text());
    const url = css.match(/src:\s*url\((https:\/\/[^)]+\.(?:ttf|otf))\)/)?.[1];
    if (!url) throw new Error(`Could not resolve Inter ${weight} from Google Fonts CSS`);
    const buf = await fetch(url).then((r) => r.arrayBuffer());
    return { name: "Inter", data: buf, weight, style: "normal" };
  };
  fontsPromise = Promise.all([grab(400), grab(700)]).catch((err) => {
    fontsPromise = null; // allow retry on the next invocation
    throw err;
  });
  return fontsPromise;
}

/** resvg's wasm binary, read from the bundled node_modules copy. */
function loadWasm() {
  if (wasmPromise) return wasmPromise;
  wasmPromise = (async () => {
    const require = createRequire(import.meta.url);
    const wasmPath = require.resolve("@resvg/resvg-wasm/index_bg.wasm");
    await initWasm(await readFile(wasmPath));
  })().catch((err) => {
    wasmPromise = null;
    throw err;
  });
  return wasmPromise;
}

const el = (type, props = {}, children) => ({
  type,
  props: { ...props, ...(children === undefined ? {} : { children }) },
});

const truncate = (value, max) => {
  const s = (value ?? "").toString().trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
};

function buildLayout({ name, role, title, accent }) {
  return el(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: "#090d16",
        fontFamily: "Inter",
        padding: 64,
      },
    },
    [
      // Ambient accent glows (the "border glow" / gradient feel).
      el("div", {
        style: {
          position: "absolute", top: -260, left: -160, width: 760, height: 760, borderRadius: 9999,
          background: `radial-gradient(circle, ${accent}40 0%, ${accent}00 68%)`,
        },
      }),
      el("div", {
        style: {
          position: "absolute", bottom: -320, right: -180, width: 820, height: 820, borderRadius: 9999,
          background: `radial-gradient(circle, ${MINT}33 0%, ${MINT}00 68%)`,
        },
      }),
      // Glassmorphic card.
      el(
        "div",
        {
          style: {
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            width: "100%", height: "100%", padding: 56, borderRadius: 28,
            backgroundColor: "rgba(255,255,255,0.045)",
            border: "1px solid rgba(255,255,255,0.10)",
          },
        },
        [
          // Brand row.
          el("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, [
            el("div", { style: { width: 26, height: 26, borderRadius: 8, backgroundColor: MINT } }),
            el(
              "div",
              { style: { display: "flex", fontSize: 24, fontWeight: 700, color: "#ffffff" } },
              [
                el("span", { style: { color: "#ffffff" } }, "Founder"),
                el("span", { style: { color: accent, marginLeft: 6 } }, "ID"),
              ],
            ),
          ]),

          // Identity block.
          el("div", { style: { display: "flex", flexDirection: "column" } }, [
            role
              ? el(
                  "div",
                  {
                    style: {
                      display: "flex", alignSelf: "flex-start", marginBottom: 22,
                      padding: "8px 18px", borderRadius: 9999, fontSize: 22, color: accent,
                      backgroundColor: `${accent}1F`, border: `1px solid ${accent}59`,
                    },
                  },
                  truncate(role, 58),
                )
              : null,
            el(
              "div",
              {
                style: {
                  display: "flex", fontSize: name.length > 22 ? 76 : 94, fontWeight: 700,
                  color: "#ffffff", lineHeight: 1.04, letterSpacing: "-0.03em",
                },
              },
              truncate(name, 40),
            ),
            title
              ? el(
                  "div",
                  {
                    style: {
                      display: "flex", marginTop: 22, fontSize: 32, lineHeight: 1.35,
                      color: "rgba(255,255,255,0.62)", maxWidth: 900,
                    },
                  },
                  truncate(title, 110),
                )
              : null,
          ].filter(Boolean)),

          // Footer badge.
          el("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, [
            el(
              "div",
              { style: { display: "flex", fontSize: 20, color: "rgba(255,255,255,0.38)" } },
              "Built with PortfolioBuilder",
            ),
            el("div", { style: { display: "flex", width: 120, height: 4, borderRadius: 9999, backgroundColor: accent } }),
          ]),
        ],
      ),
    ],
  );
}

export default async (request) => {
  try {
    const params = new URL(request.url).searchParams;
    const name = truncate(params.get("name") || "Founder", 40) || "Founder";
    const role = params.get("role") || "";
    const title = params.get("title") || "";
    const themeRaw = params.get("theme") || DEFAULT_ACCENT;
    // Only accept a hex colour — never interpolate raw query input into styles.
    const accent = /^#?[0-9a-fA-F]{6}$/.test(themeRaw)
      ? themeRaw.startsWith("#") ? themeRaw : `#${themeRaw}`
      : DEFAULT_ACCENT;

    const [fonts] = await Promise.all([loadFonts(), loadWasm()]);

    const svg = await satori(buildLayout({ name, role, title, accent }), {
      width: WIDTH,
      height: HEIGHT,
      fonts,
    });

    const png = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } }).render().asPng();

    return new Response(png, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[og] generation failed:", err);
    // Fall back to the static social image so link previews never break.
    return new Response(null, {
      status: 302,
      headers: { Location: "/og-image.jpg", "Cache-Control": "public, max-age=300" },
    });
  }
};

export const config = { path: "/api/og" };
