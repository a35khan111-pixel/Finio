import { NextResponse, type NextRequest } from "next/server";

// Proxy to Yahoo Finance to avoid CORS issues from the browser.
// Returns: { TICKER: { price, currency, name, change, changePercent } }
export async function GET(request: NextRequest) {
  const symbols = new URL(request.url).searchParams.get("symbols");

  if (!symbols) {
    return NextResponse.json({ error: "symbols query param required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,shortName,currency`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: `Yahoo Finance error: ${res.status}` }, { status: 502 });
    }

    const json = await res.json();
    const quotes: Record<string, unknown>[] = json?.quoteResponse?.result ?? [];

    const result: Record<
      string,
      { price: number; currency: string; name: string; change: number; changePercent: number }
    > = {};

    for (const q of quotes) {
      const ticker = q.symbol as string;
      result[ticker] = {
        price: (q.regularMarketPrice as number) ?? 0,
        currency: (q.currency as string) ?? "USD",
        name: (q.shortName as string) ?? ticker,
        change: (q.regularMarketChange as number) ?? 0,
        changePercent: (q.regularMarketChangePercent as number) ?? 0,
      };
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch prices" },
      { status: 500 }
    );
  }
}
