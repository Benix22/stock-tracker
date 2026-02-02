"use server"

import fs from 'fs/promises';
import path from 'path';

const HISTORY_FILE = path.join(process.cwd(), 'search-history.json');

export async function getSearchHistory(): Promise<string[]> {
    try {
        const data = await fs.readFile(HISTORY_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or error, return empty array
        return [];
    }
}

export async function addToSearchHistory(symbol: string) {
    try {
        const history = await getSearchHistory();
        const upperSymbol = symbol.toUpperCase();

        // Remove if exists (to move to top/recent) and add to front
        const newHistory = [
            upperSymbol,
            ...history.filter(s => s !== upperSymbol)
        ].slice(0, 10); // Keep last 10 items

        await fs.writeFile(HISTORY_FILE, JSON.stringify(newHistory, null, 2));
        return newHistory;
    } catch (error) {
        console.error("Failed to save history", error);
        return [];
    }
}
