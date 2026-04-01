"use server"

export interface EcbInterestRateResult {
    value: number;
    date: string;
    previous?: number;
    change?: number;
}

export async function getECBInterestRate(): Promise<EcbInterestRateResult | null> {
    try {
        // Standard ECB format: /service/data/{dataflow}/{key}
        const url = `https://data-api.ecb.europa.eu/service/data/FM/D.U2.EUR.4F.KR.MRR_FR.LEV?lastNObservations=2&format=jsondata`;
        
        const response = await fetch(url, { 
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
                "Accept": "application/vnd.sdmx.data+json;version=1.0.0-wd"
            },
            next: { revalidate: 3600 * 12 }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`ECB API error: ${response.status} ${response.statusText} - Body: ${errorBody.slice(0, 200)}`);
            return null;
        }

        const data = await response.json();
        
        const series = data.dataSets?.[0]?.series;
        if (!series) return null;
        
        const seriesKey = Object.keys(series)[0];
        const observations = series[seriesKey].observations;
        const obsKeys = Object.keys(observations).sort((a, b) => parseInt(a) - parseInt(b));
        
        if (obsKeys.length === 0) return null;
        
        const timePeriods = data.structure.dimensions.observation[0].values;
        
        const latestIdx = obsKeys[obsKeys.length - 1];
        const latestValue = observations[latestIdx][0];
        const latestDate = timePeriods[parseInt(latestIdx)].id;
        
        let previousValue = undefined;
        let change = undefined;
        
        if (obsKeys.length > 1) {
            const prevIdx = obsKeys[obsKeys.length - 2];
            previousValue = observations[prevIdx][0];
            change = latestValue - previousValue;
        }

        return {
            value: latestValue,
            date: latestDate,
            previous: previousValue,
            change: change
        };
    } catch (error) {
        console.error("Error fetching ECB interest rate:", error);
        return null;
    }
}
