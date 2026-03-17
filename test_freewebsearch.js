const query = "latest tech news";
const numResults = 10;
const SEARCH_API_URL = "https://freewebsearch.onrender.com/api/search";

async function testFetch() {
  const url = new URL(SEARCH_API_URL);
  url.searchParams.append("q", query);
  url.searchParams.append("n", numResults.toString());

  console.log(`Searching: ${url.toString()}`);

  const response = await fetch(url.toString());
  const data = await response.json();

  console.log(JSON.stringify(data, null, 2));
}

testFetch().catch(console.error);
