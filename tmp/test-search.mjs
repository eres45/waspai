async function testSearch() {
  const query = "test";
  const numResults = 5;
  const url = new URL("https://freewebsearch.onrender.com/api/search");
  url.searchParams.append("q", query);
  url.searchParams.append("n", numResults.toString());

  console.log("Fetching:", url.toString());
  try {
    const response = await fetch(url.toString());
    console.log("Status:", response.status);
    if (response.ok) {
      const data = await response.json();
      console.log("Data structure:", Object.keys(data));
      if (data.results) {
        console.log("Results count:", data.results.length);
        if (data.results.length > 0) {
          console.log("First result keys:", Object.keys(data.results[0]));
          console.log(
            "First result snippet:",
            data.results[0].body || data.results[0].snippet || "NONE",
          );
        }
      } else {
        console.log(
          "NO RESULTS PROPERTY in data:",
          JSON.stringify(data, null, 2),
        );
      }
    } else {
      console.log("Error text:", await response.text());
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

testSearch();
