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
