"use client"

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { StockProfile as StockProfileType } from "@/lib/stock-api";

interface StockProfileProps {
    profile: StockProfileType;
}

export function StockProfile({ profile }: StockProfileProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const items = [
        { label: "Symbol", value: profile.symbol },
        { label: "IPO Date", value: profile.ipoDate },
        { label: "CEO", value: profile.ceo },
        { label: "Full Time Employees", value: profile.fullTimeEmployees },
        { label: "Sector", value: profile.sector },
        { label: "Industry", value: profile.industry },
        { label: "Country", value: profile.country },
        { label: "Exchange", value: profile.exchange },
    ];

    return (
        <Card className="h-full flex flex-col overflow-hidden">
            <CardContent className="p-0 flex-1 overflow-y-auto">
                <div className="divide-y divide-border sticky top-0 bg-card z-10">
                    {items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center px-4 py-2 text-sm">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-semibold text-right truncate ml-4">{item.value || "N/A"}</span>
                        </div>
                    ))}
                </div>
                {profile.description && (
                    <div className="p-4 border-t border-border">
                        <div className={`text-sm leading-relaxed text-muted-foreground transition-all duration-300 ${isExpanded ? "" : "line-clamp-[12]"}`}>
                            {profile.description}
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="mt-4 flex items-center text-sm font-medium text-primary hover:underline"
                        >
                            {isExpanded ? (
                                <>
                                    Show less <ChevronUp className="ml-1 h-4 w-4" />
                                </>
                            ) : (
                                <>
                                    Show more <ChevronDown className="ml-1 h-4 w-4" />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
