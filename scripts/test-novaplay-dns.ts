import * as https from "https";

async function run() {
  const domain = "novaplay-cloud-gaming.waspai.in";
  console.log(`Performing HTTP GET request to https://${domain}...`);

  const req = https.get(`https://${domain}`, { timeout: 10000 }, (res) => {
    console.log(`Response Status: ${res.statusCode}`);
    console.log(`Response Headers:`, res.headers);
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      console.log(`Response body preview (first 1000 chars):`);
      console.log(data.substring(0, 1000));
    });
  });

  req.on("error", (err) => {
    console.error("HTTP request error:", err);
  });

  req.on("timeout", () => {
    console.error("HTTP request timeout!");
    req.destroy();
  });
}

run();
