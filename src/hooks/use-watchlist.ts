"use client"

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { getWatchlist, addToWatchlistAction, removeFromWatchlistAction } from "@/actions/watchlist-db";

const WATCHLIST_KEY = "stock-tracker-watchlist";

export function useWatchlist() {
    const { userId, isLoaded } = useAuth();
    const [watchlist, setWatchlist] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    // Initial load
    useEffect(() => {
        const load = async () => {
            if (isLoaded) {
                if (userId) {
                    // Load from DB
                    const data = await getWatchlist();
                    setWatchlist(data);
                } else {
                    // Fallback to localStorage for guest
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
                }
                setMounted(true);
            }
        };
        load();
    }, [isLoaded, userId]);

    const addToWatchlist = async (symbol: string) => {
        const upper = symbol.toUpperCase();
        if (!watchlist.includes(upper)) {
            const updated = [...watchlist, upper];
            setWatchlist(updated);
            
            if (userId) {
                await addToWatchlistAction(upper);
            } else {
                localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
            }
        }
    };

    const removeFromWatchlist = async (symbol: string) => {
        const upper = symbol.toUpperCase();
        const updated = watchlist.filter(s => s !== upper);
        setWatchlist(updated);
        
        if (userId) {
            await removeFromWatchlistAction(upper);
        } else {
            localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
        }
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
