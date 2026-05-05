"use client"

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface PriceUpdate {
    symbol: string;
    price: number;
    timestamp: string;
    type: 'trade' | 'quote';
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

// Singleton para evitar múltiples conexiones
let globalSocket: Socket | null = null;
let listeners = new Set<(data: PriceUpdate) => void>();
let connectionListeners = new Set<(connected: boolean) => void>();

export function useStockSocket() {
    const [lastUpdate, setLastUpdate] = useState<PriceUpdate | null>(null);
    const [connected, setConnected] = useState(globalSocket?.connected || false);

    useEffect(() => {
        const onPriceUpdate = (data: PriceUpdate) => setLastUpdate(data);
        const onConnectionChange = (status: boolean) => setConnected(status);

        listeners.add(onPriceUpdate);
        connectionListeners.add(onConnectionChange);

        if (!globalSocket) {
            console.log('📡 [Socket] Conectando a:', WS_URL);
            globalSocket = io(WS_URL, {
                transports: ['websocket', 'polling'], // Permitimos polling como fallback si websocket falla en Next.js
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
            });

            globalSocket.on('connect', () => {
                console.log('✅ [Socket] Conectado globalmente');
                setConnected(true);
                connectionListeners.forEach(l => l(true));
            });

            globalSocket.on('disconnect', (reason) => {
                console.log('❌ [Socket] Desconectado:', reason);
                setConnected(false);
                connectionListeners.forEach(l => l(false));
            });

            globalSocket.on('price_update', (data: PriceUpdate) => {
                listeners.forEach(l => l(data));
            });

            globalSocket.on('connect_error', (err) => {
                console.error('⚠️ [Socket] Error:', err.message);
            });
        }

        return () => {
            listeners.delete(onPriceUpdate);
            connectionListeners.delete(onConnectionChange);
        };
    }, []);

    const subscribe = (symbol: string) => {
        if (globalSocket) {
            globalSocket.emit('subscribe', symbol);
        }
    };

    const unsubscribe = (symbol: string) => {
        if (globalSocket) {
            globalSocket.emit('unsubscribe', symbol);
        }
    };

    return { lastUpdate, connected, subscribe, unsubscribe };
}
