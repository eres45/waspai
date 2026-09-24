const fs = require("fs");
const path = require("path");

const appJsPath = path.join(__dirname, "WaspAI app", "App.js");
let code = fs.readFileSync(appJsPath, "utf8");

// 1. Add import for apiClient
if (!code.includes("import * as API from './apiClient';")) {
  code = code.replace(
    "import { supabase } from './supabase';",
    "import { supabase } from './supabase';\nimport * as API from './apiClient';",
  );
}

// 2. Replace settings loading in initializeData
// Find: const { data: userSettings, error: settingsError } = await supabase.from('wasp_user_settings').select('*').eq('user_id', localUserId).single();
code = code.replace(
  /const \{ data: userSettings, error: settingsError \} = await supabase\s*\.from\('wasp_user_settings'\)\s*\.select\('\*'\)\s*\.eq\('user_id', localUserId\)\s*\.single\(\);/g,
  `let userSettings = null; let settingsError = null;
        try { userSettings = await API.fetchMobileSettings(); } catch(e) { settingsError = e; }`,
);

// 3. Replace settings upsert inside initializeData
// Find: await supabase.from('wasp_user_settings').upsert(payload);
code = code.replace(
  /await supabase\.from\('wasp_user_settings'\)\.upsert\(payload\);/g,
  `await API.updateMobileSettings(payload);`,
);

// 4. Replace chats loading in initializeData
// Find: const { data: remoteChats, error: chatsError } = await supabase.from('wasp_chats')...
code = code.replace(
  /const \{ data: remoteChats, error: chatsError \} = await supabase\s*\.from\('wasp_chats'\)\s*\.select\('\*'\)\s*\.eq\('user_id', localUserId\)\s*\.order\('timestamp', \{ ascending: false \}\);/g,
  `let remoteChats = null; let chatsError = null;
        try { remoteChats = await API.fetchMobileChats(); } catch(e) { chatsError = e; }`,
);

// 5. Replace messages loading in initializeData
// Find: const { data: remoteMsgs, error: msgsError } = await supabase.from('wasp_messages')...
code = code.replace(
  /const \{ data: remoteMsgs, error: msgsError \} = await supabase\s*\.from\('wasp_messages'\)\s*\.select\('\*'\)\s*\.eq\('chat_id', lastActiveChatId\)\s*\.eq\('user_id', localUserId\)\s*\.order\('id', \{ ascending: true \}\);/g,
  `let remoteMsgs = null; let msgsError = null;
          try { remoteMsgs = await API.fetchMobileMessages(lastActiveChatId); } catch(e) { msgsError = e; }`,
);

// 6. Fix `remoteChats.map(c => ({ id: Number(c.id)...` because Web DB uses string UUIDs for thread IDs.
code = code.replace(/id: Number\(c\.id\),/g, `id: c.id,`);
code = code.replace(/id: Number\(m\.id\),/g, `id: m.id,`);

// 7. Find `loadChatMessages` function
code = code.replace(
  /const \{ data: cloudMsgs, error \} = await supabase\s*\.from\('wasp_messages'\)\s*\.select\('\*'\)\s*\.eq\('chat_id', chatId\)\s*\.order\('id', \{ ascending: true \}\);/g,
  `let cloudMsgs = null; let error = null; try { cloudMsgs = await API.fetchMobileMessages(chatId); } catch(e) { error = e; }`,
);

// 8. Disable local DB syncing for chats/messages because the Web backend now handles it natively!
// Replace saveToDb
code = code.replace(
  /const saveToDb = async \(\) => \{[\s\S]*?console\.log\('\[Supabase\] Successfully synced chat history and messages to cloud\.'\);[\s\S]*?\};/g,
  `const saveToDb = async () => { /* Deprecated: Handled by Web Backend */ };`,
);

// 9. Remove Cloudflare AI worker endpoint and replace with Next.js stream call.
// Search for AI_WORKER_URL = '...'
code = code.replace(
  /const AI_WORKER_URL = 'https:\/\/unified-ai-worker\.rutv\.workers\.dev';/g,
  `const AI_WORKER_URL = 'https://waspai.in/api/chat';`,
);

fs.writeFileSync(appJsPath, code, "utf8");
console.log("App.js patched successfully for Web API unification!");
