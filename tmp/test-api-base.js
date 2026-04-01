
async function test() {
    const apiKey = "fd79f91425bd401:ruepr1bqpvf8hxe";
    const start = "2026-04-01";
    const end = "2026-07-01";
    const url = `https://api.tradingeconomics.com/calendar/country/Spain/${start}/${end}?c=${apiKey}&f=json`;
    
    console.log("URL:", url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.log("Status:", response.status);
            console.log("Body:", await response.text());
            return;
        }
        const data = await response.json();
        console.log("Data length:", data.length);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
