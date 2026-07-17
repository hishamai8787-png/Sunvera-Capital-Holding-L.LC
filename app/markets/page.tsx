import TVWidget from "@/components/tv/TVWidget";
import Watchlist from "@/components/Watchlist";
import MarketNews from "@/components/MarketNews";

export const metadata = { title: "Markets — Sunvera Capital" };

const tvTheme = {
  colorTheme: "dark",
  isTransparent: true,
  locale: "en",
};

export default function MarketsPage() {
  return (
    <main className="text-slate-100">
      {/* Ticker tape */}
      <div className="border-b border-slate-800" aria-label="Live market ticker tape">
        <TVWidget
          script="ticker-tape"
          height={46}
          transparentFrame
          config={{
            ...tvTheme,
            symbols: [
              { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
              { proName: "FOREXCOM:NSXUSD", title: "Nasdaq 100" },
              { proName: "FOREXCOM:DJI", title: "Dow" },
              { proName: "FX_IDC:EURUSD", title: "EUR/USD" },
              { proName: "FX_IDC:USDJPY", title: "USD/JPY" },
              { proName: "TVC:US10Y", title: "US 10Y" },
              { proName: "TVC:GOLD", title: "Gold" },
              { proName: "TVC:USOIL", title: "Oil (WTI)" },
              { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
            ],
            showSymbolLogo: true,
            displayMode: "adaptive",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#c5a35e]">Sunvera Capital</p>
          <h1 className="text-2xl font-semibold">Market Data Hub</h1>
        </div>

        {/* Row 1: overview + watchlist */}
        <div className="grid lg:grid-cols-5 gap-6">
          <section aria-label="Market overview" className="lg:col-span-2">
            <TVWidget
              script="market-overview"
              height={560}
              config={{
                ...tvTheme,
                dateRange: "3M",
                showChart: true,
                width: "100%",
                height: "100%",
                largeChartUrl: "",
                showSymbolLogo: true,
                plotLineColorGrowing: "rgba(197, 163, 94, 1)",
                plotLineColorFalling: "rgba(197, 163, 94, 1)",
                belowLineFillColorGrowing: "rgba(197, 163, 94, 0.12)",
                belowLineFillColorFalling: "rgba(197, 163, 94, 0.12)",
                gridLineColor: "rgba(30, 41, 59, 0)",
                scaleFontColor: "rgba(148, 163, 184, 1)",
                tabs: [
                  {
                    title: "Indices",
                    symbols: [
                      { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
                      { s: "FOREXCOM:NSXUSD", d: "Nasdaq 100" },
                      { s: "FOREXCOM:DJI", d: "Dow 30" },
                      { s: "INDEX:NKY", d: "Nikkei 225" },
                      { s: "INDEX:DEU40", d: "DAX" },
                      { s: "FOREXCOM:UKXGBP", d: "FTSE 100" },
                    ],
                  },
                  {
                    title: "Bonds",
                    symbols: [
                      { s: "TVC:US02Y", d: "US 2Y Yield" },
                      { s: "TVC:US05Y", d: "US 5Y Yield" },
                      { s: "TVC:US10Y", d: "US 10Y Yield" },
                      { s: "TVC:US30Y", d: "US 30Y Yield" },
                      { s: "TVC:DE10Y", d: "Germany 10Y" },
                      { s: "TVC:GB10Y", d: "UK 10Y" },
                    ],
                  },
                  {
                    title: "Forex",
                    symbols: [
                      { s: "FX:EURUSD", d: "EUR/USD" },
                      { s: "FX:GBPUSD", d: "GBP/USD" },
                      { s: "FX:USDJPY", d: "USD/JPY" },
                      { s: "FX:USDCHF", d: "USD/CHF" },
                      { s: "FX:AUDUSD", d: "AUD/USD" },
                      { s: "FX_IDC:USDPHP", d: "USD/PHP" },
                    ],
                  },
                  {
                    title: "Commodities",
                    symbols: [
                      { s: "TVC:GOLD", d: "Gold" },
                      { s: "TVC:SILVER", d: "Silver" },
                      { s: "TVC:USOIL", d: "WTI Crude" },
                      { s: "TVC:UKOIL", d: "Brent" },
                    ],
                  },
                ],
              }}
            />
          </section>
          <div className="lg:col-span-3 space-y-6">
            <Watchlist />
            <MarketNews />
          </div>
        </div>

        {/* Row 2: heatmap */}
        <section aria-label="S&P 500 sector heatmap">
          <h2 className="text-sm font-semibold text-slate-200 mb-2">S&amp;P 500 Heatmap</h2>
          <TVWidget
            script="stock-heatmap"
            height={480}
            config={{
              ...tvTheme,
              exchanges: [],
              dataSource: "SPX500",
              grouping: "sector",
              blockSize: "market_cap_basic",
              blockColor: "change",
              symbolUrl: "",
              hasTopBar: false,
              isDataSetEnabled: false,
              isZoomEnabled: true,
              hasSymbolTooltip: true,
              isMonoSize: false,
              width: "100%",
              height: "100%",
            }}
          />
        </section>

        {/* Row 3: forex cross rates */}
        <section aria-label="Foreign exchange cross rates">
          <h2 className="text-sm font-semibold text-slate-200 mb-2">FX Cross Rates</h2>
          <TVWidget
            script="forex-cross-rates"
            height={420}
            config={{
              ...tvTheme,
              width: "100%",
              height: "100%",
              currencies: ["EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "PHP"],
              backgroundColor: "#0f172a",
            }}
          />
        </section>

      </div>
    </main>
  );
}
