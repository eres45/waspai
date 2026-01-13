async function inspectSearch() {
  try {
    const query = "JET SET";
    const res = await fetch(
      `https://y.com.sb/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
    );
    if (!res.ok) {
      console.log("Search failed:", res.status);
      return;
    }
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      console.log("First Result Keys:", Object.keys(data[0]));
      console.log("First Result Sample:", data[0]);
    } else {
      console.log("No results or invalid format");
      console.dir(data);
    }
  } catch (e) {
    console.error(e);
  }
}
inspectSearch();
