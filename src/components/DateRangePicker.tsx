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
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium whitespace-nowrap">From:</span>
                <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-auto"
                />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium whitespace-nowrap">To:</span>
                <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-auto"
                />
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleApply} disabled={!startDate || !endDate}>
                    <SearchIcon className="h-4 w-4 mr-1" />
                    Filter
                </Button>
                {(startDate || endDate) && (
                    <Button variant="ghost" size="icon-sm" onClick={handleClear} title="Clear filter">
                        <XIcon className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
