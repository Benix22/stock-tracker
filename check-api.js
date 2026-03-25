const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

async function run() {
    const key = process.env.GEMINI_API_KEY.trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("Response Status:", res.status);
        if (data.models) {
            console.log("Available Models:", data.models.map(m => m.name));
        } else {
            console.log("Error Data:", JSON.stringify(data));
        }
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

run();
