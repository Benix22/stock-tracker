export function checkMarketOpen(): boolean {
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: "America/New_York",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: false,
        });
        const parts = formatter.formatToParts(now);
        const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || "0");

        const year = get("year");
        const month = get("month");
        const dayOfMonth = get("day");
        const hour = get("hour");
        const minute = get("minute");

        // Use the year/month/day from NY to find the weekday (0=Sun, 6=Sat)
        // This is safe because the weekday for a specific YMD is the same everywhere.
        const nyDate = new Date(year, month - 1, dayOfMonth);
        const dayOfWeek = nyDate.getDay();

        if (dayOfWeek === 0 || dayOfWeek === 6) return false;

        const timeInMinutes = hour * 60 + minute;
        // 9:30 AM = 570, 4:00 PM = 960
        return timeInMinutes >= 570 && timeInMinutes < 960;
    } catch (e) {
        return false;
    }
}
