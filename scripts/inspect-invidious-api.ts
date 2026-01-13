async function inspect() {
  try {
    const res = await fetch(
      "https://api.invidious.io/instances.json?sort_by=health",
    );
    const db = await res.json();
    const firstKey = Object.keys(db)[0];
    console.log("First Entry:", firstKey);
    console.dir(db[firstKey], { depth: null });
  } catch (e) {
    console.error(e);
  }
}
inspect();
