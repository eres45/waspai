
import fs from "fs";

async function fetchModels() {
    const response = await fetch("https://allinoneapi.codexapi.workers.dev/v1/models");
    const json = await response.json();
    fs.writeFileSync("codex_models.json", JSON.stringify(json, null, 2));
    console.log("Saved models to codex_models.json");
}

fetchModels();
