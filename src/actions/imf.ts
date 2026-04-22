"use server"

const IMF_COUNTRY_MAP: Record<string, string> = {
    "us": "USA",
    "jp": "JPN"
};

export interface IMFMacroData {
    pib: number | null;
    ipc: number | null;
    paro: number | null;
    balanza: number | null;
}

export async function getIMFMacro(countryCode: string): Promise<IMFMacroData | null> {
    const imfCountry = IMF_COUNTRY_MAP[countryCode.toLowerCase()];
    if (!imfCountry) return null;

    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear - 1, currentYear - 2].join(',');

    const indicatorMap: Record<string, keyof IMFMacroData> = {
        NGDP_RPCH: "pib",   // Real GDP growth (%)
        PCPIEPCH:  "ipc",   // Inflation, avg consumer prices (%)
        LUR:       "paro",  // Unemployment rate (%)
        BCA_NGDPD: "balanza" // Current account balance (% of GDP)
    };

    const result: IMFMacroData = { pib: null, ipc: null, paro: null, balanza: null };

    await Promise.all(
        Object.entries(indicatorMap).map(async ([indicatorCode, key]) => {
            try {
                const url = `https://www.imf.org/external/datamapper/api/v1/${indicatorCode}/${imfCountry}?periods=${years}`;
                const res = await fetch(url, { next: { revalidate: 3600 * 12 } });
                if (!res.ok) return;
                const data = await res.json();
                const countryData = data.values?.[indicatorCode]?.[imfCountry] as Record<string, number> | undefined;
                if (!countryData) return;
                for (const year of [currentYear, currentYear - 1, currentYear - 2].map(String)) {
                    if (countryData[year] !== null && countryData[year] !== undefined) {
                        result[key] = countryData[year];
                        break;
                    }
                }
            } catch {}
        })
    );

    return result;
}
