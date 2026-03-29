"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, XIcon } from "lucide-react";

interface DateRangePickerProps {
    onUpdate: (start: string | null, end: string | null) => void;
}

export function DateRangePicker({ onUpdate }: DateRangePickerProps) {
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    const handleApply = () => {
        if (startDate && endDate) {
            onUpdate(startDate, endDate);
        }
    };

    const handleClear = () => {
        setStartDate("");
        setEndDate("");
        onUpdate(null, null);
    };

    return (
        <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                <span className="text-xs font-medium whitespace-nowrap">From:</span>
                <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 text-xs flex-1"
                />
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                <span className="text-xs font-medium whitespace-nowrap">To:</span>
                <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 text-xs flex-1"
                />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                <Button variant="outline" size="sm" onClick={handleApply} disabled={!startDate || !endDate} className="h-8 flex-1 sm:flex-none">
                    <SearchIcon className="h-3.5 w-3.5 mr-1" />
                    Filter
                </Button>
                {(startDate || endDate) && (
                    <Button variant="ghost" size="icon-sm" onClick={handleClear} title="Clear filter" className="h-8 w-8">
                        <XIcon className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
