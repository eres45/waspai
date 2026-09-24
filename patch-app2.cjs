const fs = require("fs");
const path = require("path");

const appJsPath = path.join(__dirname, "WaspAI app", "App.js");
let code = fs.readFileSync(appJsPath, "utf8");

// Replace saveToDb
code = code.replace(
  /const saveToDb = async \(\) => \{[\s\S]*?console\.log\('\[Supabase\] Successfully synced chat history and messages to cloud\.'\);[\s\S]*?\};/g,
  `const saveToDb = async () => {
    try {
      const activeChat = chatHistoryRef.current.find(c => c.id === currentChatId);
      if (activeChat) {
        await API.syncMessages(currentChatId, activeChat.title, messagesRef.current);
        console.log('[Web Sync] Successfully synced messages to Next.js Database!');
      }
    } catch (e) {
      console.warn('Failed to sync to web DB:', e);
    }
  };`,
);

fs.writeFileSync(appJsPath, code, "utf8");
console.log("App.js saveToDb patched successfully!");
