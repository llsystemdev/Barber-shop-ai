import dotenv from "dotenv";
dotenv.config();

async function testEndpoint() {
    const base64Gif = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    
    console.log("Sending POST to /api/generate-image...");
    try {
        const response = await fetch("http://localhost:3000/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                image: {
                    data: base64Gif,
                    mimeType: "image/gif"
                },
                style: "Modern Fade",
                angle: "Frente",
                lighting: "Natural",
                type: "style"
            })
        });

        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Response data (keys):", Object.keys(data));
        if (data.isOfflineFallback) {
            console.log("Returned OFFLINE FALLBACK! This indicates the server call failed internally.");
            console.log("Look at the server console or logs for details, or check if the local server is running.");
        } else {
            console.log("SUCCESS! Returned real generated image.");
        }
    } catch (err: any) {
        console.error("Request failed:", err.message || err);
    }
}

testEndpoint();
