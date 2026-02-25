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
                <Command>
                    <CommandList>
                        <CommandEmpty>No history found.</CommandEmpty>
                        <CommandGroup heading="History">
                            {history.filter(h => h.includes(searchValue) || searchValue === "").map((symbol) => (
                                <CommandItem
                                    key={symbol}
                                    value={symbol}
                                    onSelect={handleSelect}
                                >
                                    <Clock className="mr-2 h-4 w-4 opacity-70" />
                                    {symbol}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
