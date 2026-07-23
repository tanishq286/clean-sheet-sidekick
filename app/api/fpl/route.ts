import { NextResponse } from "next/server";
import { getCleanSheetData } from "@/lib/fpl-api";

// Revalidate the upstream FPL fetches at most every 5 minutes.
export const revalidate = 300;

/**
 * Server-side proxy for the Fantasy Premier League API. Eliminates browser CORS
 * issues and guarantees a payload — `getCleanSheetData` degrades to mock data
 * on any upstream failure, so this route always returns 200 with usable data.
 */
export async function GET(): Promise<NextResponse> {
  const data = await getCleanSheetData();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "X-Data-Source": data.source,
    },
  });
}
