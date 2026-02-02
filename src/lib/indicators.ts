export interface DataPoint {
    date: string;
    close: number;
    volume?: number;
}

export function calculateRSI(data: DataPoint[], period: number = 14): { date: string, value: number | null }[] {
    if (data.length < period) return [];

    const changes = [];
    for (let i = 1; i < data.length; i++) {
        changes.push(data[i].close - data[i - 1].close);
    }

    const rsi = [];
    let avgGain = 0;
    let avgLoss = 0;

    // First RSI value
    for (let i = 0; i < period; i++) {
        const change = changes[i];
        if (change > 0) avgGain += change;
        else avgLoss += Math.abs(change);
    }

    avgGain /= period;
    avgLoss /= period;

    // Fill initial nulls
    for (let i = 0; i < period; i++) {
        rsi.push({ date: data[i].date, value: null });
    }

    // Calculate first RSI
    let rs = avgGain / (avgLoss || 1); // Avoid division by zero
    let firstRSI = 100 - (100 / (1 + rs));
    if (avgLoss === 0) firstRSI = 100;

    rsi.push({ date: data[period].date, value: firstRSI });

    // Calculate rest using smoothed averages
    for (let i = period + 1; i < data.length; i++) {
        const change = changes[i - 1]; // changes[period] corresponds to data[period+1] - data[period]

        let gain = change > 0 ? change : 0;
        let loss = change < 0 ? Math.abs(change) : 0;

        avgGain = ((avgGain * (period - 1)) + gain) / period;
        avgLoss = ((avgLoss * (period - 1)) + loss) / period;

        rs = avgGain / (avgLoss || 1);
        let val = 100 - (100 / (1 + rs));
        if (avgLoss === 0) val = 100;

        rsi.push({ date: data[i].date, value: val });
    }

    return rsi;
}

export function calculateBollingerBands(data: DataPoint[], period: number = 20, multiplier: number = 2): { date: string, upper: number | null, middle: number | null, lower: number | null }[] {
    if (data.length < period) return [];

    const bands = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            bands.push({ date: data[i].date, upper: null, middle: null, lower: null });
            continue;
        }

        const slice = data.slice(i - period + 1, i + 1);
        const sum = slice.reduce((acc, val) => acc + val.close, 0);
        const mean = sum / period;

        const squaredDiffs = slice.map(val => Math.pow(val.close - mean, 2));
        const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / period;
        const stdDev = Math.sqrt(variance);

        bands.push({
            date: data[i].date,
            middle: mean,
            upper: mean + (multiplier * stdDev),
            lower: mean - (multiplier * stdDev)
        });
    }

    return bands;
}
