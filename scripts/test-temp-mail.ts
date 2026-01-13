const BASE_URL = "https://socialdown.itz-ashlynn.workers.dev";

async function main() {
  try {
    const email = "07b6ede7-6e3e-4bc9-b45c-e2cdffdde500@emailhook.site"; // User's email
    console.log("Fetching messages for:", email);

    // Fetch messages and log the RAW structure
    const msgRes = await fetch(
      `${BASE_URL}/tempmail?action=messages&email=${email}`,
    );
    const msgData = await msgRes.json();

    console.log("RAW MESSAGES DATA keys:");
    if (msgData.messages.data.length > 0) {
      console.log(Object.keys(msgData.messages.data[0]));
      console.log("Sample Body Text:", msgData.messages.data[0].body_text);
      console.log(
        "Sample Body HTML:",
        msgData.messages.data[0].body_html ? "Exists" : "None",
      );
      console.log("Sample Text:", msgData.messages.data[0].text);
    } else {
      console.log("No messages found.");
    }
  } catch (err) {
    console.error("Test failed:", err);
  }
}

main();
