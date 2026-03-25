const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
        // List models is not directly available in the client-side SDK without Auth?
        // Wait, the documentation says there is a model.
        // I'll try "gemini-pro"
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello?");
        console.log("Success with gemini-pro:", result.response.text());
    } catch (e) {
        console.error("Error with gemini-pro:", e.message);
        console.error("Status:", e.status);
    }
}

listModels();
