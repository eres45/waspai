


const API_KEY = "mh_c773225704ce46caad4e9129ae0853809826033b44e8410a94a7f892d78bf";
const BASE_URL = "https://api.makehub.ai/v1/chat/completions";

async function testMakeHub() {
    console.log("Testing MakeHub connection...");
    

    // Test 3 models as requested
    const testModels = [
        "openai/gpt-4o-mini", // Fast/Cheap
        "anthropic/claude-3-5-haiku", // Alternative provider
        "google/gemini-2.0-flash" // Another provider
    ];

    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("Authorization", `Bearer ${API_KEY}`);
    
    for (const model of testModels) {
        console.log(`\nTesting model: ${model}...`);
        const body = JSON.stringify({
            model: model,
            messages: [
                { role: "user", content: "Say hello and your model name." }
            ],
            stream: false
        });

        try {
            const start = Date.now();
            // Add a timeout signal
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
            
            const response = await fetch(BASE_URL, {
                method: "POST",
                headers: headers,
                body: body,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            const duration = Date.now() - start;
            console.log(`Response Status: ${response.status} ${response.statusText}`);
            console.log(`Duration: ${duration}ms`);
            
            if (response.ok) {
                const json = await response.json();
                console.log("Response Content:", json.choices[0].message.content);
            } else {
                const text = await response.text();
                console.log("Error Body:", text);
            }
            
        } catch (error) {
            console.error("Fetch error:", error);
        }
    }
}

testMakeHub();
