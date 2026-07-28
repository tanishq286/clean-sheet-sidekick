import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import tailwindcss from "@tailwindcss/vite";

// Canonical/OG URLs in index.html must match the domain the site is actually
// served from. Netlify sets URL to the primary domain, so moving to a custom
// domain updates every absolute URL on the next deploy with no code change.
// Hardcoding these is worse than it looks: a canonical pointing at the old
// host tells search engines to index that host instead of the new one.
const SITE_URL = (
  process.env.SITE_URL ||
  process.env.URL ||
  "https://portfoliobuildersiev.netlify.app"
).replace(/\/$/, "");

// The token deliberately avoids '%': Vite runs href/src attributes through
// decodeURI, and a '%SITE_URL%' style placeholder throws "URI malformed".
// order: "pre" substitutes before Vite's HTML asset pass ever sees the tag.
function injectSiteUrl(): Plugin {
  return {
    name: "inject-site-url",
    enforce: "pre",
    transformIndexHtml: {
      order: "pre",
      handler: (html) => html.replaceAll("__SITE_URL__", SITE_URL),
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [tailwindcss(), react(), injectSiteUrl(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
