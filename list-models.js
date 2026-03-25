const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

async function run() {
    try {
        const apiKey = process.env.GEMINI_API_KEY.trim();
        const genAI = new GoogleGenerativeAI(apiKey);
        
        const models = ["gemini-pro", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp", "gemini-1.5-flash-latest"];
        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const res = await model.generateContent("Hi");
                console.log(`Model ${m} works!`);
                return;
            } catch (err) {
                console.log(`Model ${m} failed: ${err.message}`);
                console.log(`Status: ${err.status}`);
            }
        }
    } catch (e) {
        console.error("Fatal error:", e.message);
    }
}

run();
