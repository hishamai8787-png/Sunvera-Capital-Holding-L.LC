// Global market entry & tax knowledge base — curated reference data.
// IMPORTANT: informational only, not legal/tax/investment advice. Rules and
// rates change; figures reflect general rules as of mid-2025 — always verify
// with the broker, the regulator, and a qualified local adviser.

export interface Requirement {
  item: string;
  detail: string;
  howToObtain: string;
}

export interface CountryGuide {
  code: string;
  flag: string;
  country: string;
  region: string;
  exchanges: string;
  currency: string;
  access: string; // one-line: how investable is it for foreigners
  brokers: { name: string; note: string }[];
  requirements: Requirement[];
  individual: { pros: string[]; cons: string[] };
  entity: { pros: string[]; cons: string[] };
  tax: {
    capitalGains: string;
    dividends: string;
    other: string;
    optimizations: string[];
  };
}

export const COUNTRY_GUIDES: CountryGuide[] = [
  {
    code: "US",
    flag: "🇺🇸",
    country: "United States",
    region: "North America",
    exchanges: "NYSE, NASDAQ",
    currency: "USD",
    access:
      "The most accessible major market — most global brokers offer US stocks, and non-residents can open accounts remotely.",
    brokers: [
      { name: "Interactive Brokers", note: "Gold standard for non-US residents; remote onboarding from 200+ countries; has a formal API." },
      { name: "Charles Schwab International", note: "Strong for larger accounts; International account for non-residents in eligible countries." },
      { name: "Local/regional brokers with US access", note: "Many GCC and Asian banks route US orders — often at much higher commissions." },
    ],
    requirements: [
      {
        item: "Identity documents",
        detail: "Passport + proof of address (utility bill or bank statement, usually < 3 months old).",
        howToObtain: "Standard KYC — your existing documents typically suffice.",
      },
      {
        item: "Form W-8BEN (non-residents)",
        detail: "Certifies foreign status; reduces dividend withholding to your treaty rate. Valid 3 years.",
        howToObtain: "Filed electronically inside the broker's onboarding flow — no IRS interaction needed.",
      },
      {
        item: "US Taxpayer ID (only in special cases)",
        detail: "An SSN/ITIN is NOT required just to invest via a broker as a non-resident.",
        howToObtain: "If ever needed (e.g., US-source business income), apply for an ITIN with IRS Form W-7.",
      },
      {
        item: "No local address or phone required",
        detail: "Non-resident accounts use your home-country address.",
        howToObtain: "—",
      },
    ],
    individual: {
      pros: [
        "Simple W-8BEN onboarding; treaty rates apply automatically",
        "No US filing obligation from just trading stocks (broker handles withholding)",
        "No US capital gains tax for non-resident aliens on stock sales",
      ],
      cons: [
        "US estate tax exposure for non-residents on US-situs assets above $60,000 — a real planning issue for larger portfolios",
        "30% default dividend withholding if no tax treaty (GCC residents: no US treaty → 30%)",
      ],
    },
    entity: {
      pros: [
        "A non-US entity (e.g., offshore company) can block US estate-tax exposure",
        "Cleaner multi-owner structure for pooled/family capital, aligns with Sunvera-style holdcos",
      ],
      cons: [
        "W-8BEN-E onboarding is heavier; some brokers restrict entity accounts",
        "Entity setup and annual maintenance costs; possible home-country CFC rules",
        "Still 30% dividend withholding without a treaty",
      ],
    },
    tax: {
      capitalGains:
        "Residents: 0/15/20% long-term (>1 year), ordinary rates up to 37% short-term. Non-resident aliens: generally NO US tax on stock capital gains.",
      dividends: "30% withholding for non-residents, reduced by treaty (e.g., 15% for Philippines residents; GCC states have no treaty → 30%).",
      other: "Estate tax on US-situs assets >$60k for non-residents (up to 40%).",
      optimizations: [
        "Non-residents: prefer low/no-dividend growth stocks — gains escape US tax entirely, dividends don't",
        "Residents: hold >1 year for long-term rates; harvest losses against gains",
        "Large non-resident portfolios: consider Ireland-domiciled ETFs (15% treaty WHT at fund level, no US estate-tax exposure) instead of direct US holdings",
      ],
    },
  },
  {
    code: "GB",
    flag: "🇬🇧",
    country: "United Kingdom",
    region: "Europe",
    exchanges: "London Stock Exchange (LSE, AIM)",
    currency: "GBP",
    access: "Very open; non-residents can trade via international brokers easily.",
    brokers: [
      { name: "Interactive Brokers", note: "Full LSE access for residents and non-residents." },
      { name: "Hargreaves Lansdown / AJ Bell", note: "Best-in-class for UK residents (ISA/SIPP wrappers); UK residency generally required." },
    ],
    requirements: [
      { item: "Identity + address", detail: "Passport and proof of address.", howToObtain: "Standard KYC." },
      { item: "National Insurance number (residents)", detail: "Needed for ISA accounts.", howToObtain: "UK residents have one; obtained via HMRC when working in the UK." },
      { item: "No requirements beyond KYC for non-residents", detail: "Trade UK shares through IBKR et al. with home documents.", howToObtain: "—" },
    ],
    individual: {
      pros: [
        "Non-residents: NO UK capital gains tax on UK shares, and NO withholding on ordinary UK dividends — one of the friendliest regimes for foreigners",
        "Residents: ISA shelters £20,000/year completely tax-free",
      ],
      cons: [
        "0.5% stamp duty on UK share purchases (not AIM)",
        "Residents: dividend allowance now only £500; CGT allowance £3,000",
      ],
    },
    entity: {
      pros: ["Useful for UK property or business holdings"],
      cons: ["No advantage for simple share portfolios — individuals already get 0% WHT as non-residents", "Corporation tax and filing burden"],
    },
    tax: {
      capitalGains: "Residents: 18%/24% on shares above £3,000 allowance. Non-residents: generally exempt on UK shares.",
      dividends: "No UK withholding on ordinary dividends (REITs 20%). Residents pay 8.75–39.35% above £500 allowance.",
      other: "0.5% stamp duty on purchases of UK-listed shares.",
      optimizations: [
        "UK residents: max the ISA every tax year before anything else — it's a permanent tax-free wrapper",
        "Non-residents: UK dividend payers are attractive since there's no WHT leakage",
        "Watch the 'temporary non-residence' rule if leaving the UK <5 years to realize gains",
      ],
    },
  },
  {
    code: "DE",
    flag: "🇩🇪",
    country: "Germany (EU access point)",
    region: "Europe",
    exchanges: "Xetra / Frankfurt (plus EU-wide via any EU broker)",
    currency: "EUR",
    access: "Open; EU brokers passport across the bloc, so one EU account covers most European exchanges.",
    brokers: [
      { name: "Interactive Brokers (Ireland entity)", note: "Pan-European access from one account." },
      { name: "Trade Republic / Scalable Capital", note: "Low-cost German neobrokers — EU residency (often German IBAN) required." },
    ],
    requirements: [
      { item: "Identity + address", detail: "Passport, proof of address; EU brokers may require EU residency.", howToObtain: "Standard KYC; non-EU residents use IBKR instead." },
      { item: "Tax ID (Steuer-ID) for residents", detail: "Brokers report to German tax authorities automatically.", howToObtain: "Issued automatically on registering residence (Anmeldung)." },
    ],
    individual: {
      pros: ["Residents: flat 26.375% on everything — simple", "€1,000/year saver allowance (Sparerpauschbetrag)", "Non-residents: generally no German tax on share gains (home country taxes instead)"],
      cons: ["15%+ withholding on German dividends for non-residents (26.375% domestic, treaty-reduced)", "No ISA-style wrapper for regular accounts"],
    },
    entity: {
      pros: ["A GmbH pays effectively ~1.5% on share disposal gains (95% exemption) — powerful for serious equity holdcos"],
      cons: ["~30% on dividends/trading income inside the GmbH; distributions taxed again", "Accounting and filing costs; worthwhile only at scale"],
    },
    tax: {
      capitalGains: "Residents: flat 26.375% (incl. solidarity). Non-residents: generally not taxed in Germany on share gains.",
      dividends: "26.375% withholding, treaty-reduced (typically to 15%) for non-residents; refund process for the excess.",
      other: "German 'Vorabpauschale' on accumulating funds for residents.",
      optimizations: [
        "Residents with large portfolios: the GmbH structure (95% gains exemption) is the classic optimization — get German tax advice",
        "Use the €1,000 saver allowance; spouses double it",
        "Non-residents: reclaim excess dividend WHT via treaty refund forms",
      ],
    },
  },
  {
    code: "JP",
    flag: "🇯🇵",
    country: "Japan",
    region: "Asia-Pacific",
    exchanges: "Tokyo Stock Exchange (TSE)",
    currency: "JPY",
    access: "Accessible to foreigners via international brokers; domestic brokers require residency.",
    brokers: [
      { name: "Interactive Brokers", note: "Direct TSE access for non-residents." },
      { name: "Rakuten / SBI / Monex", note: "For Japan residents — NISA wrappers, Japanese-language onboarding." },
    ],
    requirements: [
      { item: "Non-residents: just KYC via international broker", detail: "No Japanese documents required.", howToObtain: "—" },
      { item: "Residents: My Number (tax ID)", detail: "Required by domestic brokers and NISA.", howToObtain: "Issued automatically to registered residents of Japan." },
    ],
    individual: {
      pros: ["Residents: flat 20.315% — simple and moderate", "NISA: permanent tax-free investing wrapper (¥3.6M/year, ¥18M lifetime)", "Non-residents: generally no Japanese tax on listed share gains"],
      cons: ["15.315% dividend withholding for non-residents (treaty may reduce)", "Currency risk on JPY for foreign investors"],
    },
    entity: {
      pros: ["Rarely useful for pure portfolio investing"],
      cons: ["~30%+ effective corporate rates; no equivalent of the German GmbH advantage"],
    },
    tax: {
      capitalGains: "Residents: 20.315% flat. Non-residents: generally exempt on listed shares.",
      dividends: "15.315% withholding for non-residents (many treaties: 10–15%).",
      other: "—",
      optimizations: ["Residents: fill NISA first — it is fully tax-free and now permanent", "Non-residents: TSE value/dividend names carry modest WHT leakage vs the US 30% for treaty-less investors"],
    },
  },
  {
    code: "SG",
    flag: "🇸🇬",
    country: "Singapore",
    region: "Asia-Pacific",
    exchanges: "SGX",
    currency: "SGD",
    access: "Extremely open; a global wealth hub with English-language onboarding.",
    brokers: [
      { name: "Interactive Brokers Singapore", note: "Full access; also a strong base account for the whole region." },
      { name: "Local banks (DBS Vickers, OCBC, UOB Kay Hian)", note: "Easy for residents; higher commissions." },
    ],
    requirements: [
      { item: "Identity + address", detail: "Passport + proof of address; NRIC/FIN for residents.", howToObtain: "Standard KYC; non-residents accepted by IBKR and several locals." },
    ],
    individual: {
      pros: [
        "NO capital gains tax — for anyone",
        "No tax on dividends in shareholders' hands (one-tier system), no dividend WHT on SGX payouts",
        "A natural regional base: tax residency in Singapore makes most global gains tax-free",
      ],
      cons: ["SGX itself is a small, income-oriented market (REITs, banks)", "Stamp duty only on physical share transfers (rare)"],
    },
    entity: {
      pros: ["Singapore holdcos are the standard Asian structure: 17% corporate rate, exemptions for foreign-sourced gains, huge treaty network"],
      cons: ["Substance requirements to enjoy treaty benefits; setup/maintenance ~S$3–5k/year"],
    },
    tax: {
      capitalGains: "None (unless trading is deemed a business).",
      dividends: "No withholding on SGX dividends; foreign dividends generally not taxed for individuals.",
      other: "—",
      optimizations: ["For globally mobile investors, Singapore tax residency itself is the optimization", "SGX REITs pay gross to individuals — clean income vehicles"],
    },
  },
  {
    code: "HK",
    flag: "🇭🇰",
    country: "Hong Kong",
    region: "Asia-Pacific",
    exchanges: "HKEX (plus China access via Stock Connect)",
    currency: "HKD",
    access: "Very open; the gateway for China exposure via Stock Connect.",
    brokers: [
      { name: "Interactive Brokers Hong Kong", note: "HKEX + Stock Connect (Shanghai/Shenzhen) access." },
      { name: "Futu (moomoo) / Tiger", note: "Popular digital brokers; remote onboarding for many nationalities." },
    ],
    requirements: [
      { item: "Identity + address", detail: "Passport + proof of address; HKID only for residents.", howToObtain: "Standard KYC; many brokers onboard non-residents remotely." },
    ],
    individual: {
      pros: ["NO capital gains tax, NO dividend withholding on HK shares", "China A-share access via Stock Connect (10% dividend WHT on A-shares)"],
      cons: ["0.1% stamp duty each side on HK trades", "Geopolitical/regulatory risk premium on the market itself"],
    },
    entity: {
      pros: ["HK companies: territorial taxation — offshore profits can be tax-free; 8.25/16.5% two-tier rate on onshore"],
      cons: ["Bank account opening for fresh HK shells has become demanding", "Economic substance scrutiny"],
    },
    tax: {
      capitalGains: "None for investors.",
      dividends: "No HK withholding. A-shares via Connect: 10% Chinese WHT.",
      other: "Stamp duty 0.1% per side.",
      optimizations: ["Dividend-heavy HK names (banks, utilities) pay gross — efficient income", "Compare H-shares (HK, no WHT) vs the same company's A-shares (10% WHT)"],
    },
  },
  {
    code: "PH",
    flag: "🇵🇭",
    country: "Philippines",
    region: "Southeast Asia",
    exchanges: "Philippine Stock Exchange (PSE)",
    currency: "PHP",
    access: "Investable for foreigners, but you'll need a local broker — international platforms don't carry the PSE.",
    brokers: [
      { name: "COL Financial", note: "Largest online retail broker; accepts non-resident applications (notarized/consularized docs)." },
      { name: "First Metro Securities / BPI Trade", note: "Bank-backed alternatives; easiest if you hold an account with the parent bank." },
    ],
    requirements: [
      {
        item: "Tax Identification Number (TIN)",
        detail: "Required by PSE brokers, including for foreigners.",
        howToObtain: "BIR Form 1904 (one-time taxpayer registration) at the Revenue District Office — non-residents can apply; some brokers assist.",
      },
      {
        item: "Identity documents",
        detail: "Passport; foreigners may need consularized or apostilled IDs when applying from abroad.",
        howToObtain: "Apostille via your foreign ministry; PH embassies handle consularization.",
      },
      {
        item: "Philippine bank account (practical)",
        detail: "Funding and settlement are far easier with a local peso account.",
        howToObtain: "BDO/BPI/Metrobank open accounts for foreigners with ACR-I card (residents) — non-residents: ask the broker about direct remittance funding instead.",
      },
      {
        item: "Foreign ownership limits",
        detail: "Constitutionally capped sectors (e.g., utilities, property at 40%) — some tickers have separate foreign boards.",
        howToObtain: "Check the stock's foreign ownership level before buying; broker platforms display it.",
      },
    ],
    individual: {
      pros: [
        "Simple exit taxation: 0.6% stock transaction tax on gross sale replaces capital gains tax for listed shares",
        "PSE dividend plays (telecoms, power, REITs) offer high nominal yields",
      ],
      cons: [
        "25% dividend withholding for non-resident aliens not engaged in business (10% for residents; ~15% with treaty relief, which requires paperwork)",
        "PHP volatility; thinner liquidity outside the PSEi 30",
      ],
    },
    entity: {
      pros: ["A domestic corporation eases repeated local dealings and sidesteps some non-resident friction", "Useful if pairing investing with Philippine business activity"],
      cons: ["25% corporate income tax (20% small); 60/40 foreign ownership rules for many activities", "SEC registration + annual compliance burden"],
    },
    tax: {
      capitalGains: "Listed shares: 0.6% stock transaction tax on gross selling price (in lieu of CGT). Unlisted: 15% CGT.",
      dividends: "Residents 10%; non-resident aliens 25% (treaty relief possible, e.g., 15%).",
      other: "Estate tax 6% — TIN and local holdings create Philippine estate exposure.",
      optimizations: [
        "The 0.6% exit tax rewards capital appreciation strategies over dividend strategies for non-residents",
        "Claim treaty rates on dividends via BIR Form 0901 before payment where a treaty exists",
        "Residents: PERA (retirement account) gives tax credits and tax-free investment income",
      ],
    },
  },
  {
    code: "QA",
    flag: "🇶🇦",
    country: "Qatar",
    region: "GCC",
    exchanges: "Qatar Stock Exchange (QSE)",
    currency: "QAR (pegged 3.64/USD)",
    access: "Open to foreign investors through QSE-member brokers; foreign ownership caps (generally up to 100% now permitted per company charter).",
    brokers: [
      { name: "QNB Financial Services", note: "Largest local broker; NIN registration handled during onboarding." },
      { name: "CBQ / Ahli Brokerage arms", note: "Bank-affiliated alternatives with similar onboarding." },
    ],
    requirements: [
      {
        item: "National Investor Number (NIN)",
        detail: "Issued by Edaa (Qatar Central Securities Depository) — mandatory before any QSE trade.",
        howToObtain: "Apply through your broker or Edaa online portal with passport/QID; takes days.",
      },
      {
        item: "QID or passport",
        detail: "Residents use QID; non-residents can register with passport.",
        howToObtain: "Standard.",
      },
      {
        item: "Local bank account (practical)",
        detail: "QAR settlement is smoother with a Qatari account.",
        howToObtain: "Residents: any local bank with QID. Non-residents: ask the broker about custody/settlement alternatives.",
      },
    ],
    individual: {
      pros: [
        "NO personal income tax, NO capital gains tax, NO tax on dividends for individuals — the cleanest regime in this list",
        "High-yield banks/industrials; QAR peg removes USD currency risk",
      ],
      cons: ["Market concentration in banks and Industries Qatar; lower liquidity", "Foreign ownership limits per company (check each ticker)"],
    },
    entity: {
      pros: ["QFC entities enjoy a clear 10% regime with exemptions for many investment activities"],
      cons: ["Mainland corporate structures involve 10% tax on Qatar-source business profits (GCC nationals exempt); unnecessary for pure portfolio investing"],
    },
    tax: {
      capitalGains: "None for individual investors.",
      dividends: "No Qatari tax on dividends for individuals.",
      other: "—",
      optimizations: [
        "For Qatar residents the local market is fully tax-free — the leakage to manage is FOREIGN withholding (e.g., 30% on US dividends since there's no US–Qatar treaty)",
        "Route international dividend exposure through Ireland-domiciled ETFs (15% US treaty at fund level) rather than direct US shares",
      ],
    },
  },
  {
    code: "SA",
    flag: "🇸🇦",
    country: "Saudi Arabia",
    region: "GCC",
    exchanges: "Tadawul (largest Arab market)",
    currency: "SAR (pegged 3.75/USD)",
    access: "GCC residents invest directly; other foreigners via QFI registration or swaps/ETFs.",
    brokers: [
      { name: "Local banks (SNB Capital, Al Rajhi Capital)", note: "For residents/GCC nationals — need Iqama/national ID and local bank account." },
      { name: "QFI route via international banks", note: "Institutional Qualified Foreign Investor registration with CMA for direct non-GCC access." },
    ],
    requirements: [
      { item: "Residents/GCC: Iqama or GCC ID + local bank account", detail: "Retail path.", howToObtain: "Standard residency documents; NIN issued via Edaa (Saudi depository) by the broker." },
      { item: "Non-GCC foreigners: QFI status", detail: "CMA registration aimed at institutions (min AUM thresholds).", howToObtain: "Via an authorized assessing person (major banks); retail investors typically use Saudi-focused ETFs instead (e.g., KSA)." },
    ],
    individual: {
      pros: ["No personal income tax or CGT on listed shares for residents", "Deep, liquid market with Aramco, banks, petrochems"],
      cons: ["5% dividend withholding for non-residents", "Direct access hard for non-GCC retail — ETF wrapper usually more practical"],
    },
    entity: {
      pros: ["Regional HQ regimes and incentives for operating businesses"],
      cons: ["20% corporate tax on non-GCC-owned share of profits; Zakat rules; irrelevant complexity for portfolio investing"],
    },
    tax: {
      capitalGains: "Exempt for listed Tadawul shares (individuals).",
      dividends: "5% withholding for non-residents; none for residents.",
      other: "—",
      optimizations: ["Non-GCC investors: the iShares KSA ETF avoids QFI paperwork at ~0.7% expense drag — usually worth it below institutional size"],
    },
  },
  {
    code: "AE",
    flag: "🇦🇪",
    country: "United Arab Emirates",
    region: "GCC",
    exchanges: "DFM (Dubai), ADX (Abu Dhabi)",
    currency: "AED (pegged 3.6725/USD)",
    access: "Very open — non-residents can obtain an investor number and trade both exchanges.",
    brokers: [
      { name: "Local brokers (EFG Hermes UAE, Al Ramz, banks)", note: "Direct DFM/ADX access after NIN registration." },
      { name: "International platforms", note: "Some (e.g., IBKR) offer ADX/DFM access; check current coverage." },
    ],
    requirements: [
      {
        item: "Investor Number (NIN)",
        detail: "One for DFM, one for ADX (both digital now).",
        howToObtain: "Apply via the DFM/ADX apps or through a broker with passport (Emirates ID for residents) — often same-day.",
      },
      { item: "Identity", detail: "Passport (non-residents) or Emirates ID.", howToObtain: "Standard." },
    ],
    individual: {
      pros: ["No personal income tax, no CGT, no dividend tax for individuals", "IPO-rich market (ADNOC listings, DEWA, Salik) with strong yields", "Non-resident friendly onboarding"],
      cons: ["Retail-heavy volatility; concentration in banks/real estate/energy"],
    },
    entity: {
      pros: ["Free-zone entities: 0% corporate tax on qualifying income; the standard regional holdco choice", "9% mainland corporate tax only above AED 375k profits — and portfolio gains of a personal investment nature stay out of scope"],
      cons: ["Economic substance requirements; free-zone qualifying-income rules need care"],
    },
    tax: {
      capitalGains: "None for individuals.",
      dividends: "No UAE withholding.",
      other: "9% corporate tax regime (2023+) targets business profits, not personal investing.",
      optimizations: [
        "Like Qatar: manage FOREIGN withholding leakage — Ireland-domiciled ETFs for US exposure",
        "A UAE free-zone SPV is a common structure for regional investors consolidating global holdings — get local advice on qualifying income status",
      ],
    },
  },
];

export const DISCLAIMER =
  "This guide is a research aid, not legal, tax, or investment advice. Rules, rates, treaties, and broker policies change frequently — figures reflect general rules as of mid-2025. Verify every requirement with the broker, exchange, and a qualified adviser in the relevant jurisdiction before acting.";
