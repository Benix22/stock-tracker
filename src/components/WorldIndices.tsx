"use client"

import { useEffect, useState, useRef, memo } from "react";
import { getBatchStockQuotes } from "@/actions/stock";
import { StockData } from "@/lib/stock-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlashingDigits } from "@/components/FlashingDigits";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import Link from "next/link";
import { InterestRate } from "@/actions/trading-economics";
import { getUSInterestRate, getFredSeries } from "@/actions/fred";
import { getECBInterestRate } from "@/actions/ecb";
import { getEurostatSeries, getEurostatBatch } from "@/actions/eurostat";

import { INDICES_CONFIG, IndexInfo } from "@/lib/constants";

const EURO_COUNTRIES = ["AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES"];

interface MacroDef { 
    source: 'FRED' | 'EUROSTAT';
    id: string; 
    units?: string; 
    params?: Record<string, string>; 
    isCurrency?: boolean; 
    isPercent?: boolean; 
}

const INDICATOR_SERIES: Record<string, Record<string, MacroDef>> = {
    "us": { 
        "pib": { source: 'FRED', id: "A191RL1Q225SBEA", isPercent: true },
        "ipc": { source: 'FRED', id: "CPIAUCSL", units: "pc1", isPercent: true },
        "paro": { source: 'FRED', id: "UNRATE", isPercent: true }, 
        "balanza": { source: 'FRED', id: "BOPGSTB", isCurrency: true }, 
        "pmi": { source: 'FRED', id: "PRMNTO01USM657S" } 
    }
};

// --- Sub-components ---

const MacroIndicators = memo(({ countryCode, eurostatData }: { countryCode: string, eurostatData?: Record<string, Record<string, number | null>> }) => {
    const [indicators, setIndicators] = useState<Record<string, { val: number | null, source: string, isCurrency?: boolean, isPercent?: boolean }>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMacro = async () => {
            const countryKey = countryCode.toUpperCase();
            
            // If it's a Euro country and we have batch data, use it
            if (eurostatData && EURO_COUNTRIES.includes(countryKey)) {
                const results: Record<string, any> = {
                    "pib": { val: eurostatData.pib?.[countryKey] ?? null, source: 'EUROSTAT', isPercent: true },
                    "ipc": { val: eurostatData.ipc?.[countryKey] ?? null, source: 'EUROSTAT', isPercent: true },
                    "paro": { val: eurostatData.paro?.[countryKey] ?? null, source: 'EUROSTAT', isPercent: true },
                    "balanza": { val: eurostatData.balanza?.[countryKey] ?? null, source: 'EUROSTAT', isCurrency: true },
                    "pmi": { val: eurostatData.pmi?.[countryKey] ?? null, source: 'EUROSTAT' }
                };
                setIndicators(results);
                setLoading(false);
                return;
            }

            // Fallback for US or other non-batch countries
            const seriesMap = INDICATOR_SERIES[countryCode] || INDICATOR_SERIES["us"]; 
            try {
                const results = await Promise.all(Object.entries(seriesMap).map(async ([key, config]) => {
                    let val = null;
                    if (config.source === 'FRED') {
                        const data = await getFredSeries(config.id, config.units);
                        val = data?.value ?? null;
                    }
                    return { key, val, isCurrency: config.isCurrency, isPercent: config.isPercent };
                }));
                const newIndicators: Record<string, any> = {};
                results.forEach(res => newIndicators[res.key] = { val: res.val, isCurrency: res.isCurrency, isPercent: res.isPercent });
                setIndicators(newIndicators);
            } catch (e) { console.error("Macro fetch error", e); }
            finally { setLoading(false); }
        };
        fetchMacro();
    }, [countryCode, eurostatData]);

    if (loading) return (
        <div className="grid grid-cols-2 gap-y-2 border-t border-border pt-3 mt-1 opacity-50 animate-pulse">
            {[1,2,3,4,5].map(i => <div key={i} className="h-6 bg-secondary/50 rounded" />)}
        </div>
    );

    return (
        <div className="grid grid-cols-2 gap-y-2 border-t border-border pt-3 mt-1">
            {Object.entries(indicators).map(([key, data]) => {
                const label = key.toUpperCase();
                let displayVal = "-";
                
                if (data.val !== null && data.val !== undefined) {
                    if (data.isCurrency) {
                        const absVal = Math.abs(data.val);
                        const formatted = absVal.toLocaleString('es-ES', { maximumFractionDigits: 0 });
                        displayVal = `${data.val < 0 ? '-' : ''}$${formatted}M`;
                    } else if (data.isPercent) {
                        displayVal = `${data.val.toFixed(2)}%`;
                    } else {
                        displayVal = data.val.toFixed(1);
                    }
                }

                return (
                    <div key={key} className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">{label}</span>
                        <span className="text-[11px] font-bold tabular-nums">{displayVal}</span>
                    </div>
                );
            })}
        </div>
    );
});
MacroIndicators.displayName = "MacroIndicators";

const StockIndexHeader = memo(({ index, flashClass }: { index: StockData & IndexInfo, flashClass: string }) => {
    const isPositive = index.change >= 0;
    return (
        <>
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 gap-3">
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-border p-0.5 shadow-sm">
                        <img src={`https://flagcdn.com/w80/${index.countryCode}.png`} alt={index.region} className="w-full h-full object-cover rounded-full" />
                    </div>
                    <div className="overflow-hidden">
                        <CardTitle className="text-sm font-bold leading-tight truncate">{index.name}</CardTitle>
                        <p className="text-[10px] text-muted-foreground uppercase mt-0.5 font-medium tracking-wide">{index.region}</p>
                    </div>
                </div>
                {isPositive ? <ArrowUpIcon className="h-4 w-4 shrink-0 text-green-500" /> : <ArrowDownIcon className="h-4 w-4 shrink-0 text-red-500" />}
            </CardHeader>
            <CardContent className="px-4 pb-0 pt-1">
                <div className="flex items-end justify-between items-center mb-2">
                    <div>
                        <div className="text-2xl font-bold tracking-tight">
                            <FlashingDigits value={index.price} decimals={2} onlyLastTwo={false} />
                        </div>
                        <div className={`text-xs font-bold flex items-center gap-1.5 mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            <span>{isPositive ? '+' : ''}{index.change.toFixed(2)}</span>
                            <span className="opacity-40 font-normal">|</span>
                            <span>{isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </>
    );
});
StockIndexHeader.displayName = "StockIndexHeader";

export function WorldIndices({ showMacro = true, initialData = [], disablePolling = false }: { showMacro?: boolean, initialData?: (StockData & IndexInfo)[], disablePolling?: boolean }) {
    const [indicesData, setIndicesData] = useState<(StockData & IndexInfo)[]>(initialData);
    const [interestRates, setInterestRates] = useState<InterestRate[]>([]);
    const [eurostatData, setEurostatData] = useState<Record<string, Record<string, number | null>>>({});
    const [flashStates, setFlashStates] = useState<Record<string, string>>({});

    const prevPrices = useRef<Record<string, number>>({});

    // Sync with initialData if parent updates it (unified polling)
    useEffect(() => {
        if (initialData && initialData.length > 0) {
            setIndicesData(initialData);
            
            // Handle flashes even when data comes from parent
            initialData.forEach(index => {
                const prevPrice = prevPrices.current[index.symbol];
                if (prevPrice !== undefined && index.price !== prevPrice) {
                    const isIncrease = index.price > prevPrice;
                    setFlashStates(prev => ({ ...prev, [index.symbol]: isIncrease ? "bg-green-500/10" : "bg-red-500/10" }));
                    setTimeout(() => setFlashStates(prev => ({ ...prev, [index.symbol]: "" })), 1000);
                }
                prevPrices.current[index.symbol] = index.price;
            });
        }
    }, [initialData]);

    const fetchIndices = async () => {
        try {
            const symbols = INDICES_CONFIG.map(i => i.symbol);
            const quotes = await getBatchStockQuotes(symbols);
            const combinedData = INDICES_CONFIG.map(config => {
                const quote = quotes.find(q => q.symbol === config.symbol);
                return { ...config, ...(quote || { price: 0, change: 0, changePercent: 0, symbol: config.symbol, name: config.name }) } as StockData & IndexInfo;
            });
            setIndicesData(combinedData);
            combinedData.forEach(index => {
                const prevPrice = prevPrices.current[index.symbol];
                if (prevPrice !== undefined && index.price !== prevPrice) {
                    const isIncrease = index.price > prevPrice;
                    setFlashStates(prev => ({ ...prev, [index.symbol]: isIncrease ? "bg-green-500/10" : "bg-red-500/10" }));
                    setTimeout(() => setFlashStates(prev => ({ ...prev, [index.symbol]: "" })), 1000);
                }
                prevPrices.current[index.symbol] = index.price;
            });
        } catch (error) { console.error("Index fetch error", error); }
    };

    const fetchRates = async () => {
        try {
            const [fredRate, ecbRate] = await Promise.all([ getUSInterestRate(), getECBInterestRate() ]);
            const updatedRates: InterestRate[] = [];
            if (fredRate) updatedRates.push({ country: "USA (FRED)", value: fredRate.value, previous: fredRate.previous ?? fredRate.value, lastUpdate: fredRate.date });
            if (ecbRate) updatedRates.push({ country: "EuroZone (ECB)", value: ecbRate.value, previous: ecbRate.previous ?? ecbRate.value, lastUpdate: ecbRate.date });
            setInterestRates(updatedRates);
        } catch (error) { console.error("Rate fetch error", error); }
    };

    const fetchEurostatBatchMacro = async () => {
        try {
            const geos = EURO_COUNTRIES;
            const [pib, ipc, paro, balanza, pmi] = await Promise.all([
                getEurostatBatch("namq_10_gdp", { geo: geos, unit: 'CLV_PCH_PRE', na_item: 'B1GQ', s_adj: 'SCA', lastTimePeriod: '4' }),
                getEurostatBatch("prc_hicp_manr", { geo: geos, coicop: 'CP00', lastTimePeriod: '4' }),
                getEurostatBatch("une_rt_m", { geo: geos, age: 'TOTAL', unit: 'PC_ACT', s_adj: 'SA', lastTimePeriod: '4' }),
                getEurostatBatch("teiet215", { geo: geos, stk_flow: 'BAL_RT', lastTimePeriod: '4' }),
                getEurostatBatch("ei_isbs_m", { geo: geos, indic: 'BS-ESI-I', s_adj: 'SA', lastTimePeriod: '4' })
            ]);
            setEurostatData({ pib, ipc, paro, balanza, pmi });
        } catch (e) { console.error("Eurostat batch fetch fail", e); }
    };

    useEffect(() => {
        if (!initialData || initialData.length === 0) {
            fetchIndices(); 
        }
        
        fetchRates(); 
        if (showMacro) {
            fetchEurostatBatchMacro();
        }

        let indexInterval: NodeJS.Timeout | undefined;
        if (!disablePolling) {
            indexInterval = setInterval(fetchIndices, 10000);
        }
        
        const ratesInterval = setInterval(fetchRates, 3600000);
        return () => { 
            if (indexInterval) clearInterval(indexInterval); 
            clearInterval(ratesInterval); 
        };
    }, [showMacro, disablePolling]);


    if (indicesData.length === 0 && interestRates.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold tracking-tight">World Indices</h2>
                    {!showMacro && (
                        <Link href="/world-indices" className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group">
                            View Macro Analysis <ArrowUpIcon className="w-3 h-3 rotate-45 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                    )}
                </div>
                {interestRates.length > 0 && (
                    <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-1 no-scrollbar">
                        {interestRates.map((rate) => {
                            const isUSA = rate.country.includes("USA");
                            const label = isUSA ? "Fed Funds Effective" : "BCE Main Refi Rate";
                            const flagCode = isUSA ? "us" : "eu";
                            return (
                                <div key={rate.country} className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-secondary/30 border border-border/50 shrink-0">
                                    <div className="w-5 h-5 rounded-full overflow-hidden border border-border/50 shrink-0">
                                        <img src={`https://flagcdn.com/w40/${flagCode}.png`} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-0.5">{label}</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-black tracking-tight">{rate.value.toFixed(2)}%</span>
                                            <span className={`text-[9px] font-bold ${rate.value >= rate.previous ? 'text-green-500' : 'text-red-500'}`}>
                                                {rate.value === rate.previous ? '•' : (rate.value > rate.previous ? '↑' : '↓')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {indicesData.map((index) => (
                    <Link key={index.symbol} href={`/stock/${index.symbol}`} className="block h-full">
                        <Card className={`w-full h-full transition-colors duration-1000 relative overflow-hidden ${flashStates[index.symbol] || ""} hover:bg-accent/50 cursor-pointer flex flex-col`}>
                            <StockIndexHeader index={index} flashClass={flashStates[index.symbol] || ""} />
                            {showMacro && (
                                <div className="px-4 pb-4">
                                    <MacroIndicators countryCode={index.countryCode} eurostatData={eurostatData} />
                                </div>
                            )}
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}

