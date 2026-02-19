import { NextResponse, type NextRequest } from "next/server";

// Proxy Yahoo Finance symbol search to avoid CORS from the browser.
// Returns top matching quotes for autocomplete.
export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get("q");

  if (!q || q.trim().length < 1) {
    return NextResponse.json({ quotes: [] });
  }

  const searchHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    Origin: "https://finance.yahoo.com",
    Referer: "https://finance.yahoo.com/",
  };

  // Try both query hosts for resilience
  const searchUrls = [
    `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&enableFuzzyQuery=true&enableCb=false&enableNavLinks=false`,
    `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&enableFuzzyQuery=true&enableCb=false&enableNavLinks=false`,
  ];

  try {
    let res: Response | null = null;
    for (const url of searchUrls) {
      try {
        const r = await fetch(url, { headers: searchHeaders, next: { revalidate: 60 } });
        if (r.ok) { res = r; break; }
      } catch { continue; }
    }
    if (!res) return NextResponse.json({ quotes: [] });

    const json = await res.json();
    const raw: Record<string, unknown>[] = json?.quotes ?? [];

    // Filter to tradeable instruments only
    const quotes = raw
      .filter((q) => ["Equity", "ETF", "Fund", "Cryptocurrency", "Index"].includes(q.typeDisp as string))
      .slice(0, 8)
      .map((q) => ({
        symbol: q.symbol as string,
        name: (q.shortname || q.longname || q.symbol) as string,
        exchange: (q.exchDisp || "") as string,
        type: (q.typeDisp || "Equity") as string,
      }));

    return NextResponse.json({ quotes });
  } catch {
    return NextResponse.json({ quotes: [] });
  }
}
