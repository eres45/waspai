async function testVideoGen() {
  const promptText = "A cute cat sleeping";
  const apiUrl = `https://metaai-1xpj.onrender.com/generate/video/v2?prompt=${encodeURIComponent(promptText)}`;

  console.log(`Testing Meta AI Video API with Simple Prompt...`);
  console.log(`URL: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log(`Raw Response:`, text);

    if (response.ok) {
      const data = JSON.parse(text);
      const videoUrl = data.video_urls?.[0] || data.video || data.url;
      if (videoUrl) {
        console.log(`\n✅ Success! Video URL: ${videoUrl}`);
      } else {
        console.log(`\n❌ Failed: No video URL found in response.`);
      }
    }
  } catch (error) {
    console.error(`\n❌ Request failed:`, error.message);
  }
}

testVideoGen();
