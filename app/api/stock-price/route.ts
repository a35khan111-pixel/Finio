import { NextResponse, type NextRequest } from "next/server";

// Fetches price via the v8/finance/chart endpoint — more reliable from server
// environments (Vercel) than the v7/quote endpoint which Yahoo often blocks.
async function fetchSymbolPrice(symbol: string): Promise<{
  price: number;
  currency: string;
  name: string;
  change: number;
  changePercent: number;
} | null> {
  const urls = [
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
  ];

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Origin: "https://finance.yahoo.com",
    Referer: "https://finance.yahoo.com/",
  };

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers, cache: "no-store" });
      if (!res.ok) continue;

      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (!meta || !meta.regularMarketPrice) continue;

      const price: number = meta.regularMarketPrice;
      const prev: number = meta.chartPreviousClose ?? meta.previousClose ?? price;
      const change = price - prev;
      const changePercent = prev !== 0 ? (change / prev) * 100 : 0;

      return {
        price,
        currency: meta.currency ?? "USD",
        name: meta.longName ?? meta.shortName ?? symbol,
        change,
        changePercent,
      };
    } catch {
      continue;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const symbolsParam = new URL(request.url).searchParams.get("symbols");
  if (!symbolsParam) {
    return NextResponse.json({ error: "symbols query param required" }, { status: 400 });
  }

  const symbols = symbolsParam.split(",").map((s) => s.trim()).filter(Boolean);

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const data = await fetchSymbolPrice(symbol);
      return { symbol, data };
    })
  );

  const output: Record<string, typeof results[0]["data"]> = {};
  for (const { symbol, data } of results) {
    output[symbol] = data;
  }

  return NextResponse.json(output, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
  });
}
