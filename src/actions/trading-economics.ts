"use server"

import { format, addMonths } from "date-fns";

export interface TradingEconomicsEvent {
    CalendarId: string;
    Date: string;
    Country: string;
    Event: string;
    Reference: string;
    Unit: string;
    Source: string;
    Actual: string;
    Previous: string;
    Forecast: string;
    TEForecast: string;
    URL: string;
    Importance: number; // 1, 2, or 3 usually
    LastUpdate: string;
}

export async function getCalendarEvents(): Promise<TradingEconomicsEvent[]> {
  const apiKey = process.env.TRADING_ECONOMICS;
  if (!apiKey) {
    console.warn("TRADING_ECONOMICS API key not found in environment variables");
    return [];
  }

  const start = format(new Date(), "yyyy-MM-dd");
  const end = format(addMonths(new Date(), 3), "yyyy-MM-dd");

  try {
    const url = `https://api.tradingeconomics.com/calendar/country/All/${start}/${end}?c=${apiKey}&f=json`;
    const response = await fetch(url, { 
        next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
            console.error("TradingEconomics API: Authentication failed. Check your key.");
        }
        return [];
    }

    const data = await response.json();
    
    // Sometimes the API returns an object with a message or just an array
    if (!Array.isArray(data)) {
        console.error("TradingEconomics API returned non-array data:", data);
        return [];
    }

    // Sort by importance then date, and limit to 50 events for performance
    return data
        .sort((a, b) => {
            if (b.Importance !== a.Importance) {
                return b.Importance - a.Importance;
            }
            return new Date(a.Date).getTime() - new Date(b.Date).getTime();
        })
        .slice(0, 50);
  } catch (error) {
    console.error("Error fetching TradingEconomics calendar:", error);
    return [];
  }
}

export interface InterestRate {
    country: string;
    value: number;
    previous: number;
    lastUpdate: string;
}

export async function getInterestRates(): Promise<InterestRate[]> {
  const apiKey = process.env.TRADING_ECONOMICS;
  if (!apiKey) {
    console.warn("TRADING_ECONOMICS API key not found in environment variables");
    return [];
  }

  try {
    const countries = encodeURIComponent("United States,Euro Area");
    const url = `https://api.tradingeconomics.com/indicators/country/${countries}/indicator/Interest%20Rate?c=${apiKey}&f=json`;
    
    const response = await fetch(url, { 
        next: { revalidate: 3600 * 6 } // Cache for 6 hours
    });

    if (!response.ok) {
        return [];
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
        return getMockInterestRates();
    }

    return data.map(item => ({
        country: item.Country,
        value: parseFloat(item.LatestValue),
        previous: parseFloat(item.PreviousValue),
        lastUpdate: item.LastUpdate
    }));
  } catch (error) {
    console.error("Error fetching interest rates:", error);
    return getMockInterestRates();
  }
}

export interface EconomicIndicator {
    country: string;
    indicator: string;
    value: string;
    lastUpdate: string;
    unit: string;
}

export async function getCountryIndicators(countries: string[]): Promise<EconomicIndicator[]> {
  const apiKey = process.env.TRADING_ECONOMICS;
  if (!apiKey) {
    console.warn("TRADING_ECONOMICS API key not found in environment variables");
    return getMockIndicators(countries);
  }

  try {
    const countriesStr = encodeURIComponent(countries.join(","));
    const url = `https://api.tradingeconomics.com/country/${countriesStr}?c=${apiKey}&f=json`;
    
    const response = await fetch(url, { 
        next: { revalidate: 3600 * 24 } // Cache indicators for 24 hours
    });

    if (!response.ok) {
        return getMockIndicators(countries);
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
        // Some users might only have access to guest countries
        if (data.Message && data.Message.includes("No Access")) {
            return getMockIndicators(countries);
        }
        return getMockIndicators(countries);
    }

    const requestedCategories = [
        "GDP", 
        "Inflation Rate", 
        "Unemployment Rate", 
        "Balance of Trade", 
        "Manufacturing PMI",
        "Services PMI",
        "Composite PMI"
    ];

    return data
        .filter(item => requestedCategories.some(cat => item.Category.includes(cat)))
        .map(item => ({
            country: item.Country,
            indicator: item.Category,
            value: item.LatestValue.toString(), 
            lastUpdate: item.LatestValueDate,
            unit: item.Unit
        }));
  } catch (error) {
    console.error("Error fetching economic indicators:", error);
    return getMockIndicators(countries);
  }
}

function getMockIndicators(countries: string[]): EconomicIndicator[] {
    const result: EconomicIndicator[] = [];
    const mocks = [
        { cat: "GDP", val: "2.5", unit: "Percent" },
        { cat: "Inflation Rate", val: "3.2", unit: "Percent" },
        { cat: "Unemployment Rate", val: "11.5", unit: "Percent" },
        { cat: "Balance of Trade", val: "2450", unit: "EUR Million" },
        { cat: "Manufacturing PMI", val: "51.2", unit: "Index" }
    ];

    countries.forEach(country => {
        mocks.forEach(m => {
            result.push({
                country,
                indicator: m.cat,
                value: m.val,
                lastUpdate: new Date().toISOString(),
                unit: m.unit
            });
        });
    });
    return result;
}

function getMockInterestRates(): InterestRate[] {
    return [
        { country: "United States", value: 5.50, previous: 5.50, lastUpdate: new Date().toISOString() },
        { country: "Euro Area", value: 4.50, previous: 4.50, lastUpdate: new Date().toISOString() }
    ];
}


