


const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
];

const getRandomIP = () => {
    return Array.from(
      { length: 4 },
      () => Math.floor(Math.random() * 255) + 1,
    ).join(".");
};

async function testDeepInfra() {
    console.log("Testing DeepInfra connection...");
    
    // Test model: Try a small, generic model
    const model = "meta-llama/Meta-Llama-3-8B-Instruct";
    const url = "https://api.deepinfra.com/v1/openai/chat/completions";

    const headers = new Headers();
    // Browser-like standard headers
    headers.set("Accept", "text/event-stream");
    headers.set("Accept-Language", "en-US,en;q=0.9");
    headers.set("Cache-Control", "no-cache");
    headers.set("Connection", "keep-alive");
    headers.set("Content-Type", "application/json");
    headers.set("Origin", "https://deepinfra.com");
    headers.set("Pragma", "no-cache");
    headers.set("Referer", "https://deepinfra.com/");
    headers.set("User-Agent", userAgents[0]);
    // Try REMOVING X-Deepinfra-Source
    // headers.set("X-Deepinfra-Source", "web-page"); 
    
    headers.set("X-Forwarded-For", getRandomIP());
    
    // Explicitly NO Authorization
    
    const body = JSON.stringify({
        model: model,
        messages: [
            { role: "user", content: "Hello, are you working?" }
        ],
        stream: false
    });

    console.log("Request Headers:", Object.fromEntries(headers.entries()));

    try {
        const start = Date.now();
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: body
        });
        const duration = Date.now() - start;

        console.log(`Response Status: ${response.status} ${response.statusText}`);
        console.log(`Duration: ${duration}ms`);
        
        const text = await response.text();
        console.log("Response Body:", text.substring(0, 500) + (text.length > 500 ? "..." : ""));
        
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testDeepInfra();
