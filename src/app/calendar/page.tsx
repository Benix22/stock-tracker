import { getCalendarEvents } from "@/actions/trading-economics";
import { EconomicCalendarTable } from "@/components/EconomicCalendarTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Economic Calendar | StockTracker",
  description: "Global macroeconomic events and market catalysts for the next 3 months.",
};

export const revalidate = 3600; // Revalidate every hour

export default async function CalendarPage() {
  const events = await getCalendarEvents();

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">
            Economic <span className="text-primary">Calendar</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-2xl">
            Real-time global macro indicators, central bank decisions, and market-moving catalysts powered by TradingEconomics.
          </p>
        </div>

        <EconomicCalendarTable events={events} />
      </div>
    </div>
  );
}
