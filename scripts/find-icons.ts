import * as si from "simple-icons";
import fs from "fs";

const logos = [
  "siOpenai",
  "siAnthropic",
  "siGooglegemini",
  "siMeta",
  "siMistral",
  "siCohere",
  "siPerplexity",
  "siHuggingface",
];

const found = [];
for (const [key] of Object.entries(si)) {
  const normalizedKey = key.toLowerCase();
  for (const requested of logos) {
    if (normalizedKey.includes(requested.toLowerCase().replace("si", ""))) {
      if (!found.includes(key)) found.push(key);
    }
  }
}

console.log("Found icons:");
found.forEach((k: any) => {
  const icon = (si as any)[k];
  console.log(`${k} -> #${icon?.hex}`);
  console.log(icon?.path);
  console.log("---");
});
