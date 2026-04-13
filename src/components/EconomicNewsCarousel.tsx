"use client";

import { useEffect, useState } from "react";
import { getEconomicNews } from "@/actions/news";
import { ExternalLink, Newspaper, RefreshCcw } from "lucide-react";
import Link from "next/link";

export function EconomicNewsCarousel() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      try {
        const data = await getEconomicNews();
        setNews(data);
      } catch (error) {
        console.error("Error loading news:", error);
      } finally {
        setLoading(false);
      }
    }
    loadNews();
  }, []);

  if (loading) return (
    <div className="fixed top-16 left-0 right-0 z-30 w-full bg-background/50 backdrop-blur-md h-10 flex items-center px-4 overflow-hidden border-b border-border">
      <div className="flex items-center gap-2 mr-6 shrink-0 font-bold text-[10px] uppercase tracking-tighter text-muted-foreground animate-pulse">
        <Newspaper className="w-3.5 h-3.5" />
        <span>Loading News...</span>
      </div>
      <div className="flex gap-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-3 w-64 bg-muted/50 rounded-full shrink-0 animate-pulse" />
        ))}
      </div>
    </div>
  );

  if (news.length === 0) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-30 w-full bg-background/80 backdrop-blur-xl border-b border-border/10 h-10 flex items-center overflow-hidden transition-all duration-500">
      {/* Label side */}
      <div className="flex items-center gap-2 px-4 bg-background/90 z-20 h-full border-r border-border/20 shrink-0 shadow-[4px_0_12px_rgba(0,0,0,0.05)]">
        <div className="relative">
          <Newspaper className="w-3.5 h-3.5 text-primary" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </div>
        <span className="font-black text-[10px] uppercase tracking-[0.2em] text-foreground/80">
          Live
        </span>
      </div>

      {/* Marquee Container */}
      <div className="flex-1 relative overflow-hidden h-full flex items-center">
        {/* Gradients to hide edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        <div className="flex whitespace-nowrap animate-marquee-fast hover:pause-marquee cursor-default">
          {/* Loop many times to ensure coverage */}
          {[...news, ...news, ...news].map((item, index) => (
            <a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-8 text-[13px] hover:text-primary transition-all duration-300 group/item border-r border-border/5 whitespace-nowrap"
            >
              <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-tighter opacity-70 group-hover/item:opacity-100 transition-opacity">
                {item.source}
              </span>
              <span className="font-medium text-foreground/70 group-hover/item:text-foreground transition-colors max-w-md overflow-hidden text-ellipsis">
                {item.title}
              </span>
              <ExternalLink className="w-3 h-3 text-primary opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
