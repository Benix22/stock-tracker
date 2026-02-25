"use client"

import * as React from "react"
import { Search, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    PopoverAnchor,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface SearchHistoryInputProps {
    history: string[];
    onSearch: (symbol: string) => void;
    loading?: boolean;
    searchValue: string;
    onSearchValueChange: (value: string) => void;
}

export function SearchHistoryInput({
    history,
    onSearch,
    loading,
    searchValue,
    onSearchValueChange
}: SearchHistoryInputProps) {
    const [open, setOpen] = React.useState(false)

    const handleSelect = (currentValue: string) => {
        onSearchValueChange(currentValue)
        setOpen(false)
        onSearch(currentValue)
    }

    const handleSubmit = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchValue) {
            e.preventDefault();
            setOpen(false);
            onSearch(searchValue);
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverAnchor asChild>
                <div className="relative w-full md:w-[300px]">
                    <div className="flex items-center border rounded-md px-3 py-2 bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-5 w-full bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Search stock..."
                            value={searchValue}
                            onChange={(e) => {
                                onSearchValueChange(e.target.value.toUpperCase());
                                setOpen(true);
                            }}
                            onFocus={() => setOpen(true)}
                            onKeyDown={handleSubmit}
                            disabled={loading}
                        />
                    </div>
                </div>
            </PopoverAnchor>
            <PopoverContent
                className="p-0 w-[300px]"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="bg-popover text-popover-foreground border rounded-md shadow-md">
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
                        Recent Searches
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1">
                        {history.length > 0 ? (
                            history.map((symbol) => (
                                <div
                                    key={symbol}
                                    onClick={() => handleSelect(symbol)}
                                    className="flex items-center w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors group"
                                >
                                    <Clock className="mr-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <span className="font-medium ml-2">{symbol}</span>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                No history yet.
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
