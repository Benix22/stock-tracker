"use client"

import { useEffect, useState, useRef } from "react"

interface FlashingDigitsProps {
    value: number;
    decimals?: number;
    className?: string;
    prefix?: string;
    suffix?: string;
}

export function FlashingDigits({ value, decimals = 2, className = "", prefix = "", suffix = "" }: FlashingDigitsProps) {
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
    // Split into main part and last two digits
    const mainPart = formatted.slice(0, -2);
    const lastTwo = formatted.slice(-2);

    return (
        <span className={className}>
            {prefix}
            {mainPart}
            <span className={`transition-colors duration-300 ${flashColor}`}>
                {lastTwo}
            </span>
            {suffix}
        </span>
    );
}
