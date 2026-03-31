import { TradingEconomicsEvent } from "@/actions/trading-economics";
import { format, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, ArrowRight, Info, AlertCircle, CalendarDays, ExternalLink } from "lucide-react";

interface Props {
  events: TradingEconomicsEvent[];
}

// Simple country name to ISO mapping for flags
const COUNTRY_MAP: Record<string, string> = {
  "United States": "us",
  "Euro Area": "eu",
  "United Kingdom": "gb",
  "China": "cn",
  "Japan": "jp",
  "Germany": "de",
  "France": "fr",
  "Italy": "it",
  "Spain": "es",
  "Canada": "ca",
  "Australia": "au",
  "Switzerland": "ch",
  "South Korea": "kr",
  "India": "in",
  "Brazil": "br",
  "Russia": "ru",
  "South Africa": "za",
  "Mexico": "mx",
};

export function EconomicCalendarTable({ events }: Props) {
  if (!events || events.length === 0) {
    return (
      <Card className="w-full bg-card border-border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground italic">
          <AlertCircle className="w-8 h-8 mb-4 opacity-20" />
          <p>No economic events found for the next 3 months.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden border-border bg-card shadow-xl relative">
       <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 pointer-events-none text-primary">
          <Globe className="w-48 h-48" />
       </div>

      <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-border relative z-10">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3 text-foreground">
            <CalendarDays className="w-6 h-6 text-primary" />
            Macroeconomic Calendar
          </CardTitle>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">TradingEconomics Data Engine</span>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Real-time Feed</span>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
           <div className="flex -space-x-2">
              {[ "us", "eu", "gb", "cn", "jp" ].map(c => (
                <div key={c} className="w-6 h-6 rounded-full border-2 border-card overflow-hidden shadow-sm">
                   <img src={`https://flagcdn.com/w40/${c}.png`} alt={c} className="w-full h-full object-cover" />
                </div>
              ))}
           </div>
           <span className="text-[10px] font-bold text-muted-foreground/60 ml-2">Global Catalyst Scanner</span>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-foreground">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Date / Time</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Region</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Event Catalyst</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Impact</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right tabular-nums">Forecast</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right tabular-nums">Previous</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((event, i) => {
                const eventDate = new Date(event.Date);
                const isToday = isSameDay(eventDate, new Date());
                const countryCode = COUNTRY_MAP[event.Country] || "un";
                
                return (
                  <tr key={i} className={`group hover:bg-muted/40 transition-all duration-300 ${isToday ? "bg-primary/5" : ""}`}>
                    <td className={`px-6 py-5 ${isToday ? "border-l-4 border-primary pl-5" : ""}`}>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">
                          {format(eventDate, "MMM dd")}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground/60 tabular-nums">
                          {format(eventDate, "HH:mm")} GMT
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-xl bg-muted flex items-center justify-center p-1 shadow-sm border border-border group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                          {countryCode !== "un" ? (
                            <img src={`https://flagcdn.com/w40/${countryCode}.png`} alt={event.Country} className="w-full h-full object-contain rounded-sm" />
                          ) : (
                            <Globe className="w-4 h-4 text-muted-foreground opacity-40" />
                          )}
                        </div>
                        <span className="text-xs font-bold text-foreground/80 group-hover:text-foreground transition-colors">{event.Country}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 max-w-md">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-black tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
                             {event.Event}
                           </span>
                           {event.URL && (
                             <a href={`https://tradingeconomics.com${event.URL}`} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/60 hover:text-primary">
                               <ExternalLink className="w-3 h-3" />
                             </a>
                           )}
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground italic truncate group-hover:text-foreground/70 transition-colors">Source: {event.Source}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center flex-col items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map((step) => (
                            <div 
                              key={step} 
                              className={`w-1.5 h-3 rounded-full ${
                                step <= (event.Importance || 1) 
                                  ? (event.Importance === 3 ? "bg-rose-500 shadow-sm" : event.Importance === 2 ? "bg-amber-500" : "bg-primary") 
                                  : "bg-muted"
                              }`} 
                            />
                          ))}
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${
                           event.Importance === 3 ? "text-rose-600" : event.Importance === 2 ? "text-amber-600" : "text-primary/60"
                        }`}>
                          {event.Importance === 3 ? "Critical" : event.Importance === 2 ? "Moderate" : "Low Risk"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right tabular-nums">
                        {event.Forecast ? (
                          <div className="flex flex-col">
                             <span className="text-xs font-black text-foreground">{event.Forecast}{event.Forecast && event.Unit && !event.Forecast.includes(event.Unit) ? event.Unit : ""}</span>
                             <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Estimate</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/30">—</span>
                        )}
                    </td>
                    <td className="px-6 py-5 text-right tabular-nums">
                        {event.Previous ? (
                          <div className="flex flex-col">
                             <span className="text-xs font-black text-foreground/50 group-hover:text-foreground/80 transition-colors">{event.Previous}{event.Previous && event.Unit && !event.Previous.includes(event.Unit) ? event.Unit : ""}</span>
                             <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">Ref: {event.Reference}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/30">—</span>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between">
           <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              <Info className="w-3.5 h-3.5" />
              Impact levels based on historical volatility metrics
           </div>
           <div className="text-[9px] font-bold text-muted-foreground/40 italic">
              All timezones UTC. Data updated every 60 minutes.
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
