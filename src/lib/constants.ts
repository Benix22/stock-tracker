export interface IndexInfo {
    symbol: string;
    name: string;
    region: string;
    countryCode: string;
}

export const INDICES_CONFIG: IndexInfo[] = [
    { symbol: "^IBEX", name: "IBEX 35", region: "Spain", countryCode: "es" },
    { symbol: "^GSPC", name: "S&P 500", region: "USA", countryCode: "us" },
    { symbol: "^NDX", name: "Nasdaq 100", region: "USA", countryCode: "us" },
    { symbol: "^STOXX50E", name: "Euro Stoxx 50", region: "Europe", countryCode: "eu" },
    { symbol: "^GDAXI", name: "DAX", region: "Germany", countryCode: "de" },
    { symbol: "^FCHI", name: "CAC 40", region: "France", countryCode: "fr" },
    { symbol: "FTSEMIB.MI", name: "FTSE MIB", region: "Italy", countryCode: "it" },
    { symbol: "^N225", name: "Nikkei 225", region: "Asia", countryCode: "jp" }
];

export const OVERVIEW_SYMBOLS = ["BTC-USD", "ETH-USD", "BZ=F", "NG=F", "GC=F", "HG=F", "EURUSD=X", "GBPUSD=X", "JPY=X", "CHF=X", "AUDUSD=X"];

export const DASHBOARD_SYMBOLS = ['AAPL', 'MSFT', 'TSLA', 'SGHC', 'NVDA', 'BTC-USD', 'EUR=X'];

export const IBEX35_SYMBOLS = [
    "ANA.MC", "ANE.MC", "ACX.MC", "ACS.MC", "AENA.MC", "AMS.MC", "MTS.MC", "SAB.MC", "SAN.MC", 
    "BKT.MC", "BBVA.MC", "CABK.MC", "CLNX.MC", "ENG.MC", "ELE.MC", "FER.MC", "FLUI.MC", "GRF.MC", 
    "IAG.MC", "IBE.MC", "IDR.MC", "ITX.MC", "LOG.MC", "MAP.MC", "MRL.MC", "NTGY.MC", "PUIG.MC", 
    "RED.MC", "REP.MC", "ROVI.MC", "SCYR.MC", "SLBA.MC", "TEF.MC", "UNI.MC", "COL.MC"
];
