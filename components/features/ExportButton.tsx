"use client";

import * as React from "react";
import { FileImage, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportMatrixCsv, exportNodeToPng } from "@/lib/export";
import type { CleanSheetData, OddsMode } from "@/lib/types";

interface ExportButtonProps {
  data: CleanSheetData;
  mode: OddsMode;
  matrixRef: React.RefObject<HTMLDivElement | null>;
}

export function ExportButton({ data, mode, matrixRef }: ExportButtonProps) {
  const [pngBusy, setPngBusy] = React.useState(false);

  const handleCsv = () => {
    try {
      exportMatrixCsv(data, mode);
      toast.success("CSV exported", { description: "Clean-sheet matrix saved to your device." });
    } catch (error) {
      toast.error("CSV export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handlePng = async () => {
    const node = matrixRef.current;
    if (!node) {
      toast.error("Nothing to export yet");
      return;
    }
    setPngBusy(true);
    try {
      await exportNodeToPng(node, `clean-sheet-matrix-${mode}.png`);
      toast.success("PNG exported", { description: "High-resolution image saved." });
    } catch (error) {
      toast.error("PNG export failed", {
        description: error instanceof Error ? error.message : "Try the CSV export instead.",
      });
    } finally {
      setPngBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleCsv}>
        <FileSpreadsheet className="size-4" />
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handlePng} disabled={pngBusy}>
        {pngBusy ? <Loader2 className="size-4 animate-spin" /> : <FileImage className="size-4" />}
        PNG
      </Button>
    </div>
  );
}
