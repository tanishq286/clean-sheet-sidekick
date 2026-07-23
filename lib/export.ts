import { saveAs } from "file-saver";
import { toPng } from "html-to-image";
import { formatPercent } from "@/lib/utils";
import type { CleanSheetData, OddsMode } from "@/lib/types";

/** Export the clean-sheet matrix as a CSV of probabilities per gameweek. */
export function exportMatrixCsv(data: CleanSheetData, mode: OddsMode): void {
  const header = ["Team", ...data.horizon.map((gw) => `GW${gw}`), "Average"];
  const lines: string[] = [header.join(",")];

  for (const row of data.rows) {
    const cells = row.cells.map((cell) => {
      if (cell.blank) return "-";
      const prob = mode === "market" ? cell.marketProb : cell.modelProb;
      return `${(prob * 100).toFixed(1)}% (${cell.isHome ? "H" : "A"} ${cell.opponentShort})`;
    });
    lines.push(
      [`"${row.team.name}"`, ...cells.map((c) => `"${c}"`), formatPercent(row.averageProb, 1)].join(","),
    );
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  saveAs(blob, `clean-sheet-matrix-${mode}.csv`);
}

/** Rasterise a DOM node to a PNG. Best-effort; throws on capture failure. */
export async function exportNodeToPng(node: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#0A0F0D",
  });
  saveAs(dataUrl, filename);
}
