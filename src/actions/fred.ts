"use server"

export interface FredDataPoint {
    date: string;
    value: string;
}

export interface InterestRateResult {
    value: number;
    date: string;
    previous?: number;
    change?: number;
}

export async function getUSInterestRate(): Promise<InterestRateResult | null> {
    return getFredSeries("DFF");
}

export async function getFredSeries(seriesId: string, units?: string): Promise<InterestRateResult | null> {
    const apiKey = process.env.FRED_API_KEY;
    if (!apiKey) {
        console.warn("FRED_API_KEY not found in environment variables");
        return null;
    }

    try {
        let url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`;
        if (units) {
            url += `&units=${units}`;
        }
        
        const response = await fetch(url, { 
            next: { revalidate: 3600 * 12 }
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const observations = data.observations as FredDataPoint[];

        if (!observations || observations.length === 0) {
            return null;
        }

        const latest = parseFloat(observations[0].value);
        const previous = observations.length > 1 ? parseFloat(observations[1].value) : undefined;
        let change = undefined;
        
        if (previous !== undefined && !isNaN(latest) && !isNaN(previous)) {
            change = latest - previous;
        }

        return {
            value: isNaN(latest) ? 0 : latest,
            date: observations[0].date,
            previous: previous,
            change: change
        };
    } catch (error) {
        console.error(`Error fetching FRED series ${seriesId}:`, error);
        return null;
    }
}
