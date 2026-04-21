"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatLeagueNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { CalendarDays, Trophy, ChevronLeft, ChevronRight } from "lucide-react";

interface HistoryEntry {
  league: {
    month: string;
    year: string;
  };
  topTraders: {
    id: string;
    userFullName: string | null;
    userImageUrl: string | null;
    totalValue: number;
    profitPct: number;
  }[];
}



export function LeagueHistoryList({ history }: { history: HistoryEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 300 : scrollLeft + 300;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full py-4 group/carousel relative">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-black tracking-[0.2em] text-zinc-400 uppercase">Season Archives</h3>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full bg-white/5 border border-white/5 hover:bg-white/10"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="w-3 h-3 text-white" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full bg-white/5 border border-white/5 hover:bg-white/10"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-3 h-3 text-white" />
          </Button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar scroll-smooth snap-x snap-mandatory"
      >
        {history.map((entry, idx) => {
          const monthIdx = parseInt(entry.league.month) - 1;
          const monthName = monthNames[monthIdx];
          
          if (entry.topTraders.length === 0) return null;

          return (
            <div key={idx} className="flex-shrink-0 w-[260px] bg-white/[0.02] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.04] transition-all group relative overflow-hidden snap-start">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <Trophy className="w-12 h-12 text-amber-500" />
              </div>

              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 border-b border-white/5 pb-2">
                {monthName} {entry.league.year}
              </div>
              
              <div className="space-y-3">
                {entry.topTraders.map((trader, tIdx) => (
                  <div key={trader.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`text-[9px] font-black w-3 ${tIdx === 0 ? 'text-amber-500' : 'text-zinc-600'}`}>
                        {tIdx + 1}
                      </div>
                      <Avatar className="w-5 h-5 border border-white/10">
                        <AvatarImage src={trader.userImageUrl || ""} />
                        <AvatarFallback className="text-[7px] font-bold bg-zinc-800">{trader.userFullName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className={`text-[10px] font-bold truncate max-w-[90px] ${tIdx === 0 ? 'text-white' : 'text-zinc-400'}`}>
                        {trader.userFullName?.split(' ')[0]}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] font-black ${tIdx === 0 ? 'text-white' : 'text-zinc-400'}`}>
                        {formatLeagueNumber(trader.totalValue, 0, "$")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
