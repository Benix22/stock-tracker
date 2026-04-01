"use server"

export interface EurostatResult {
    value: number;
    date: string;
}

export async function getEurostatSeries(dataset: string, params: Record<string, string>): Promise<EurostatResult | null> {
    try {
        const queryParams = new URLSearchParams({
            ...params,
            format: 'JSON',
            lang: 'EN'
        });

        const url = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${dataset}?${queryParams.toString()}`;
        
        const response = await fetch(url, { 
            next: { revalidate: 3600 * 24 } 
        });

        if (!response.ok) return null;

        const data = await response.json();
        
        const values = data.value;
        if (!values) return null;

        let latestValue: number;
        if (Array.isArray(values)) {
            latestValue = values[values.length - 1];
        } else {
            const keys = Object.keys(values).sort((a, b) => parseInt(b) - parseInt(a));
            latestValue = values[keys[0]];
        }

        const timeDimension = data.dimension.time;
        const timeIndices = timeDimension.category.index;
        const timeLabels = timeDimension.category.label;
        const latestTimeKey = Object.keys(timeIndices).sort((a, b) => timeIndices[b] - timeIndices[a])[0];
        const latestDate = timeLabels ? timeLabels[latestTimeKey] : latestTimeKey;

        return { value: latestValue, date: latestDate || "Latest" };
    } catch (error) {
        console.error(`Error fetching Eurostat dataset ${dataset}:`, error);
        return null;
    }
}

export async function getEurostatBatch(dataset: string, params: Record<string, string | string[]>): Promise<Record<string, number | null>> {
    try {
        const baseUrl = `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${dataset}`;
        const finalUrl = new URL(baseUrl);
        
        Object.entries(params).forEach(([key, val]) => {
            if (Array.isArray(val)) {
                val.forEach(v => finalUrl.searchParams.append(key, v));
            } else {
                finalUrl.searchParams.append(key, val);
            }
        });
        
        finalUrl.searchParams.append('format', 'JSON');
        finalUrl.searchParams.append('lang', 'EN');
        finalUrl.searchParams.append('lastTimePeriod', '1');

        const response = await fetch(finalUrl.toString(), { 
            next: { revalidate: 3600 * 24 }
        });

        if (!response.ok) return {};

        const data = await response.json();
        const results: Record<string, number | null> = {};
        
        const values = data.value;
        if (!values) return {};

        const geoDimension = data.dimension.geo.category.index;
        const timeDimension = data.dimension.time.category.index;
        const geoList = Object.keys(geoDimension);
        const timeList = Object.keys(timeDimension);
        const numTimes = timeList.length;
        
        geoList.forEach(geo => {
            const geoIdx = geoDimension[geo];
            let foundValue: number | null = null;
            // Iterate from latest to oldest record for this country
            for (let t = numTimes - 1; t >= 0; t--) {
                const valIndex = (geoIdx * numTimes) + t;
                const val = Array.isArray(values) ? values[valIndex] : values[valIndex]; 
                // Note: values can be an array OR an object with index keys in JSON-stat
                const actualVal = (values as any)[valIndex];
                if (actualVal !== undefined && actualVal !== null) {
                    foundValue = actualVal;
                    break;
                }
            }
            results[geo] = foundValue;
        });

        return results;
    } catch (error) {
        console.error(`Batch Eurostat error for ${dataset}:`, error);
        return {};
    }
}
