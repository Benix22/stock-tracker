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

export const INDEX_CONSTITUENTS: Record<string, string[]> = {
    "^IBEX": IBEX35_SYMBOLS,
    "^GSPC": ["AAPL", "MSFT", "AMZN", "NVDA", "GOOGL", "META", "BRK-B", "TSLA", "UNH", "JPM", "XOM", "V", "MA", "AVGO", "HD", "PG", "COST", "ABBV", "ADBE", "LLY", "CRM", "PEP", "BAC", "CVX", "MRK", "ORCL", "KO", "AMD", "WMT", "MCD"],
    "^NDX": ["AAPL", "MSFT", "AMZN", "NVDA", "GOOGL", "META", "TSLA", "AVGO", "PEP", "COST", "ADBE", "AZN", "LIN", "CSCO", "AMD", "CMCSA", "TMUS", "NFLX", "TXN", "AMGN", "INTC", "HON", "INTU", "SBUX", "GILD", "VRTX", "MDLZ", "REGN", "ISRG", "PYPL"],
    "^STOXX50E": ["ASML.AS", "MC.PA", "SAP.DE", "LIN", "TTE.PA", "SIE.DE", "SAN.MC", "BBVA.MC", "OR.PA", "AIR.PA", "AI.PA", "ASML.AS", "ABI.BR", "AD.AS", "BMW.DE", "BNP.PA", "CS.PA", "DTE.DE", "ELE.MC", "ENEL.MI", "ENI.MI", "IBE.MC", "ITX.MC", "KER.PA", "MBG.DE", "OR.PA", "RMS.PA", "SAP.DE", "SIE.DE", "VOW3.DE"],
    "^GDAXI": ["SAP.DE", "SIE.DE", "DTE.DE", "ALV.DE", "AIR.DE", "MBG.DE", "BMW.DE", "VOW3.DE", "BAS.DE", "BAYN.DE", "DHL.DE", "MUV2.DE", "IFX.DE", "BEI.DE", "RWE.DE", "HNR1.DE", "MRK.DE", "ADS.DE", "HEN3.DE", "LIN.DE"],
    "^FCHI": ["MC.PA", "OR.PA", "TTE.PA", "AIR.PA", "SAN.PA", "AI.PA", "RMS.PA", "KER.PA", "BN.PA", "CS.PA", "BNP.PA", "DG.PA", "OR.PA", "EL.PA", "STLAP.PA", "ML.PA", "ACA.PA", "VIE.PA", "CA.PA", "GLE.PA"],
    "FTSEMIB.MI": ["ENI.MI", "ISP.MI", "UCG.MI", "ENEL.MI", "RACE.MI", "STLAM.MI", "G.MI", "PRY.MI", "CPH.MI", "MONC.MI", "TIT.MI", "SRG.MI", "TRN.MI", "LDO.MI", "A2A.MI", "PST.MI", "REC.MI", "BZU.MI", "FBK.MI", "IVG.MI"],
    "^N225": ["7203.T", "9984.T", "6758.T", "8035.T", "9983.T", "6098.T", "4063.T", "8306.T", "6501.T", "6954.T", "4502.T", "7741.T", "6367.T", "2914.T", "6723.T", "6981.T", "4519.T", "8001.T", "8058.T", "8031.T"]
};
