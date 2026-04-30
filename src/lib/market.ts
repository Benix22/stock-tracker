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
            weekday: "short",
            hour12: false,
        });
        const parts = formatter.formatToParts(now);
        const get = (type: string) => parts.find(p => p.type === type)?.value || "0";

        const hour = parseInt(get("hour"));
        const minute = parseInt(get("minute"));
        const weekday = get("weekday"); // "Mon", "Tue", etc.

        if (weekday === "Sat" || weekday === "Sun") return false;

        const timeInMinutes = hour * 60 + minute;
        // 9:30 AM = 570, 4:00 PM = 960
        return timeInMinutes >= 570 && timeInMinutes < 960;
    } catch (e) {
        return false;
    }
}
