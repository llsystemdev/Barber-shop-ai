import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function test() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    console.log("Using API key:", apiKey ? "Present (ends with " + apiKey.slice(-4) + ")" : "MISSING");
    if (!apiKey) {
        console.error("No API key available!");
        return;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Create a simple 1x1 base64 transparent gif as input
    const base64Gif = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

    try {
        console.log("Testing gemini-3.1-flash-lite-image with responseModalities in config...");
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/gif", data: base64Gif } },
                    { text: "Make the background red" }
                ]
            },
            config: {
                responseModalities: ["IMAGE"]
            }
        });
        console.log("SUCCESS with config!", JSON.stringify(response, null, 2));
    } catch (err: any) {
        console.error("FAILED with config error:", err.message || err);
        console.error("Error stack:", err.stack);
    }
}

test();
