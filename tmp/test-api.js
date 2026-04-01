
async function test() {
    const apiKey = "fd79f91425bd401:ruepr1bqpvf8hxe";
    const countries = encodeURIComponent("United States,Euro Area");
    const url = `https://api.tradingeconomics.com/indicators/country/${countries}/indicator/Interest%20Rate?c=${apiKey}&f=json`;
    
    console.log("URL:", url);
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Data length:", data.length);
        if (Array.isArray(data)) {
            data.forEach(d => console.log(`- ${d.Country}: ${d.LatestValue} (${d.Category}) (Current: ${d.LatestValue} | Prev: ${d.PreviousValue})`));
        } else {
            console.log("Data:", data);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
