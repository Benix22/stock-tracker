"use client"

import { useEffect, useState, useRef } from "react"

interface FlashingDigitsProps {
    value: number;
    decimals?: number;
    className?: string;
    prefix?: string;
    suffix?: string;
    onlyLastTwo?: boolean;
}

export function FlashingDigits({ value, decimals = 2, className = "", prefix = "", suffix = "", onlyLastTwo = true }: FlashingDigitsProps) {
    const [flashColor, setFlashColor] = useState("");
    const prevValueRef = useRef(value);

    useEffect(() => {
        if (value !== prevValueRef.current) {
            const isIncrease = value > prevValueRef.current;
            setFlashColor(isIncrease ? "text-green-500" : "text-red-500");

            const timer = setTimeout(() => {
                setFlashColor("");
            }, 1000);

            prevValueRef.current = value;
            return () => clearTimeout(timer);
        }
    }, [value]);

    const formatted = value.toFixed(decimals);

    if (!onlyLastTwo) {
        return (
            <span className={`${className} transition-colors duration-1000 ${flashColor}`}>
                {prefix}{formatted}{suffix}
            </span>
        );
    }

    // Split into main part and last two digits
    const mainPart = formatted.slice(0, -2);
    const lastTwo = formatted.slice(-2);

    return (
        <span className={className}>
            {prefix}
            {mainPart}
            <span className={`transition-colors duration-1000 ${flashColor}`}>
                {lastTwo}
            </span>
            {suffix}
        </span>
    );
}
