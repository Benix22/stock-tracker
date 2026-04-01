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
        console.log(`[Eurostat API Request] URL: ${url}`);
        
        const response = await fetch(url, { 
            next: { revalidate: 3600 * 24 } 
        });

        if (!response.ok) {
            console.error(`[Eurostat API Error] Status: ${response.status} for ${dataset}`);
            return null;
        }

        const data = await response.json();
        console.log(`[Eurostat Raw Data] Dataset: ${dataset} Response:`, JSON.stringify(data).substring(0, 500) + "...");
        
        // JSON-stat 2.0 extraction
        const values = data.value;
        if (!values) return null;

        let latestValue: number;
        if (Array.isArray(values)) {
            latestValue = values[values.length - 1];
        } else {
            // It might be an object where keys are indices
            const lastKey = Object.keys(values).sort((a, b) => parseInt(b) - parseInt(a))[0];
            latestValue = values[lastKey];
        }

        // Extracting time label
        const timeDimension = data.dimension.time;
        const timeIndices = timeDimension.category.index;
        const timeLabels = timeDimension.category.label;
        
        // Find the index of the last time period
        const latestTimeKey = Object.keys(timeIndices).sort((a, b) => timeIndices[b] - timeIndices[a])[0];
        const latestDate = timeLabels ? timeLabels[latestTimeKey] : latestTimeKey;

        return {
            value: latestValue,
            date: latestDate || "Latest"
        };
    } catch (error) {
        console.error(`Error fetching Eurostat dataset ${dataset}:`, error);
        return null;
    }
}
