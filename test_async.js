// Quick test to verify the async issue
async function testSubmit() {
  console.log("1. Submit called");

  // Simulate YouTube fetch (takes 2 seconds)
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log("2. YouTube fetch completed (after 2s)");

  console.log("3. Sending message");
}

// Simulate what happens when editor calls onEnter
console.log("Starting test...");
testSubmit(); // Called without await!
console.log("After testSubmit() call - THIS PRINTS IMMEDIATELY");

// The issue: without await, execution continues immediately
// Expected order: Start test -> 1 -> 2 (after 2s) -> 3 -> After call
// Actual order: Start test -> 1 -> After call -> 2 (after 2s) -> 3
