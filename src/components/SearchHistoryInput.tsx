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
}

export function SearchHistoryInput({ history, onSearch, loading }: SearchHistoryInputProps) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")

    const handleSelect = (currentValue: string) => {
        setValue(currentValue)
        setOpen(false)
        onSearch(currentValue)
    }

    const handleSubmit = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && value) {
            e.preventDefault();
            setOpen(false);
            onSearch(value);
        }
    }

    // To make the input feel like a standard input but with history, 
    // we can use the Popover with a CommandInput inside.
    // Or we can simple use the Command as a combobox.

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverAnchor asChild>
                <div className="relative w-full md:w-[300px]">
                    <div className="flex items-center border rounded-md px-3 py-2 bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-5 w-full bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Search stock..."
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value.toUpperCase());
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
                    {/* We don't use CommandInput here because we have the input in the Trigger. 
              However, pure shadcn combobox usually puts CommandInput inside.
              Let's accept that for history, we want to filter simply against the history list. 
           */}

                    <CommandList>
                        <CommandEmpty>No history found.</CommandEmpty>
                        <CommandGroup heading="History">
                            {history.map((symbol) => (
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
