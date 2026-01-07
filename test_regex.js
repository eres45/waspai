// Test the regex pattern and URL detection
const testUrl = "can u explain me this video\n\nhttps://youtu.be/vkhjO7fc78g";

// The regex from prompt-input.tsx
const regex =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

console.log("Testing URL:", testUrl);
console.log("Regex test:", regex.test(testUrl));
console.log("Regex match:", testUrl.match(regex));

// Test the extractYouTubeUrls function logic
const extractRegex =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s]*)?/g;
const matches = testUrl.match(extractRegex);
console.log("Extract URLs result:", matches);

// Test video ID extraction
const videoIdMatch = testUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
console.log("Video ID:", videoIdMatch ? videoIdMatch[1] : null);
