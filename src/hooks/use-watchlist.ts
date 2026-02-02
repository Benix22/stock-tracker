"use client"

import { useState, useEffect } from "react";

const WATCHLIST_KEY = "stock-tracker-watchlist";

export function useWatchlist() {
    const [watchlist, setWatchlist] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    // Initial load
    useEffect(() => {
        const stored = localStorage.getItem(WATCHLIST_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setWatchlist(parsed);
                }
            } catch (e) {
                console.error("Failed to parse watchlist", e);
            }
        }
        setMounted(true);
    }, []);

    const addToWatchlist = (symbol: string) => {
        const upper = symbol.toUpperCase();
        if (!watchlist.includes(upper)) {
            const updated = [...watchlist, upper];
            setWatchlist(updated);
            localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
        }
    };

    const removeFromWatchlist = (symbol: string) => {
        const upper = symbol.toUpperCase();
        const updated = watchlist.filter(s => s !== upper);
        setWatchlist(updated);
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    };

    const isWatched = (symbol: string) => {
        return watchlist.includes(symbol.toUpperCase());
    }

    return {
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isWatched,
        mounted
    };
}
