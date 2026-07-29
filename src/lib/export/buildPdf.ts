import jsPDF from "jspdf";
// The `-pro` fork, not the original: html2canvas 1.x's color parser doesn't
// understand oklch(), which is what Tailwind v4's palette resolves to, so
// every export crashed on `Attempting to parse an unsupported color
// function`. This fork adds oklch/oklab/lab/lch/color-mix support and is
// otherwise a drop-in replacement — same call, same options.
import html2canvas from "html2canvas-pro";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { getTemplate } from "@/templates/registry";
import type { FullProfile } from "@/types/founder";
import { collectAssets, rewriteProfileUrls } from "./assets";

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export async function buildPdf(profile: FullProfile) {
  const { assets } = await collectAssets(profile);
  const dataMap: Record<string, string> = {};
  for (const a of assets) dataMap[a.originalUrl] = await blobToDataUrl(a.blob);
  const inlined = rewriteProfileUrls(profile, dataMap);

  const Template = getTemplate(profile.template_id).Component;
  const html = renderToStaticMarkup(createElement(Template, { profile: inlined }));

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = "1024px";
  host.style.background = "#ffffff";
  host.innerHTML = html;
  document.body.appendChild(host);

  try {
    await new Promise((r) => setTimeout(r, 300));
    const canvas = await html2canvas(host, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(`${profile.slug}-portfolio.pdf`);
  } finally {
    document.body.removeChild(host);
  }
}