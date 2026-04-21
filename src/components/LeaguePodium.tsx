import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Medal, Award, TrendingUp } from "lucide-react";
import { formatLeagueNumber } from "@/lib/utils";

interface PodiumParticipant {
  id: string;
  userFullName: string | null;
  userImageUrl: string | null;
  totalValue: number;
  profitPct: number;
}

export function LeaguePodium({ participants }: { participants: PodiumParticipant[] }) {
  if (participants.length === 0) return null;

  // Order: [2nd, 1st, 3rd] for display
  const displayOrder = [];
  if (participants[1]) displayOrder.push(participants[1]); // 2nd
  if (participants[0]) displayOrder.push(participants[0]); // 1st
  if (participants[2]) displayOrder.push(participants[2]); // 3rd

  return (
    <div className="w-full py-12">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-3">
          <Crown className="w-6 h-6 text-amber-500 animate-bounce" />
          Hall of Fame: Previous Season
        </h2>
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Honoring the top performing traders</p>
      </div>

      <div className="flex items-end justify-center gap-4 md:gap-8 max-w-4xl mx-auto px-4">
        {displayOrder.map((p, index) => {
          const isFirst = p.id === participants[0].id;
          const isSecond = p.id === participants[1]?.id;
          const isThird = p.id === participants[2]?.id;

          let height = "h-32 md:h-40";
          let color = "bg-zinc-800/40";
          let icon = <Award className="w-5 h-5 text-zinc-400" />;
          let trophyColor = "text-zinc-400";

          if (isFirst) {
            height = "h-48 md:h-64";
            color = "bg-gradient-to-t from-amber-500/20 to-amber-500/5 border-amber-500/20";
            icon = <Crown className="w-8 h-8 text-amber-500" />;
            trophyColor = "text-amber-500";
          } else if (isSecond) {
            height = "h-40 md:h-52";
            color = "bg-gradient-to-t from-zinc-400/20 to-zinc-400/5 border-zinc-400/20";
            icon = <Medal className="w-6 h-6 text-zinc-400" />;
            trophyColor = "text-zinc-300";
          } else if (isThird) {
            height = "h-32 md:h-40";
            color = "bg-gradient-to-t from-amber-700/20 to-amber-700/5 border-amber-700/20";
            icon = <Medal className="w-6 h-6 text-amber-700" />;
            trophyColor = "text-amber-700";
          }

          return (
            <div key={p.id} className="flex flex-col items-center flex-1 max-w-[200px] animate-in slide-in-from-bottom-10 duration-1000">
              <div className="mb-4 relative">
                <Avatar className={`w-16 h-16 md:w-20 md:h-20 border-2 ${isFirst ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'border-white/10'}`}>
                  <AvatarImage src={p.userImageUrl || ""} />
                  <AvatarFallback className="bg-zinc-800 text-lg font-bold">{p.userFullName?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="absolute -top-3 -right-3 bg-[#030303] rounded-full p-1.5 border border-white/10 shadow-lg">
                  {icon}
                </div>
              </div>

              <div className={`w-full ${height} ${color} border rounded-t-3xl flex flex-col items-center justify-start pt-6 text-center px-2 backdrop-blur-sm relative overflow-hidden`}>
                {isFirst && (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.1),transparent)]" />
                )}
                
                <div className="relative z-10 space-y-1">
                  <div className="text-sm md:text-base font-black text-white truncate max-w-full">
                    {p.userFullName?.split(' ')[0]}
                  </div>
                  <div className={`text-[10px] md:text-xs font-bold ${trophyColor} uppercase tracking-widest`}>
                    {isFirst ? "Champion" : isSecond ? "2nd Place" : "3rd Place"}
                  </div>
                  <div className="pt-2">
                    <div className="text-xs md:text-sm font-black text-white">
                      {formatLeagueNumber(p.totalValue, 0, "$")}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[9px] md:text-[10px] font-black text-emerald-400">
                      <TrendingUp className="w-3 h-3" />
                      +{p.profitPct.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
