const fs = require("fs");
const content = fs.readFileSync("WaspAI app/App.js", "utf8");

const startMarker = "// Supabase background syncing engines";
const endMarker = "// Model selector state";

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.log("Markers not found!");
} else {
  const newBlock = `// Supabase background syncing engines
  const syncThreadsToSupabase = async (threads) => {
    try {
      if (!userId || !threads || threads.length === 0) return;
      if (!isPremium && memoryUsage.total > 50 * 1024 * 1024) {
        console.warn('[Supabase] Sync blocked: Free cloud memory limit exceeded.');
        return;
      }
      const rows = threads.map(t => ({
        id: t.id,
        user_id: userId,
        title: t.title || 'New Chat',
        preview: t.preview || '',
        timestamp: t.timestamp || t.id,
      }));
      const { error } = await supabase.from('wasp_chats').upsert(rows, { onConflict: 'id' });
      if (error) console.warn('[Supabase] Error syncing threads:', error.message);
    } catch (err) {
      console.warn('[Supabase] Sync failed (Offline/Network issue):', err);
    }
  };

  const syncMessagesToSupabase = async (chatId, messages) => {
    try {
      if (!userId || !chatId) return;
      if (!isPremium && memoryUsage.total > 50 * 1024 * 1024) {
        console.warn('[Supabase] Sync blocked: Free cloud memory limit exceeded.');
        return;
      }
      const currentThread = chatHistoryRef.current.find(c => c.id === chatId);
      await supabase.from('wasp_chats').upsert({
        id: chatId,
        user_id: userId,
        title: currentThread?.title || 'New Chat',
        preview: currentThread?.preview || '',
        timestamp: currentThread?.timestamp || chatId,
      }, { onConflict: 'id' });

      if (!messages || messages.length === 0) {
        await supabase.from('wasp_messages').delete().eq('chat_id', chatId).eq('user_id', userId);
        return;
      }
      const rows = messages.map(m => ({
        id: m.id,
        chat_id: chatId,
        user_id: userId,
        role: m.isUser ? 'user' : 'assistant',
        text: m.text || '',
        type: m.type || 'text',
        is_user: m.isUser,
        prompt: m.prompt || null,
        image_url: m.imageUrl || null,
        video_url: m.videoUrl || null,
        attachments: m.attachments ? m.attachments.map(att => {
          if (att.type === 'document') {
            const { textContent, ...rest } = att;
            return rest;
          }
          return att;
        }) : [],
      }));
      const { error } = await supabase.from('wasp_messages').upsert(rows, { onConflict: 'id' });
      if (error) console.warn('[Supabase] Error syncing messages:', error.message);
    } catch (err) {
      console.warn('[Supabase] Sync messages failed:', err);
    }
  };

  const updateMessages = (newMessagesOrFn) => {
    setMessages(prev => {
      const resolved = typeof newMessagesOrFn === 'function' ? newMessagesOrFn(prev) : newMessagesOrFn;
      AsyncStorage.setItem(\`WASP_CHAT_MESSAGES_\${currentChatId}\`, JSON.stringify(resolved)).catch(err => {
        console.warn('Error saving messages:', err);
      });
      recalculateMemory(null, resolved, null).then(metrics => {
        if (!isPremium && metrics.total > 50 * 1024 * 1024) {
          setShowSubscriptionScreen(true);
        } else {
          syncMessagesToSupabase(currentChatId, resolved);
        }
      });
      return resolved;
    });
  };

  const updateChatHistory = (newHistoryOrFn) => {
    setChatHistory(prev => {
      const resolved = typeof newHistoryOrFn === 'function' ? newHistoryOrFn(prev) : newHistoryOrFn;
      AsyncStorage.setItem('WASP_CHAT_THREADS', JSON.stringify(resolved)).catch(err => {
        console.warn('Error saving threads:', err);
      });
      recalculateMemory(resolved, null, null).then(metrics => {
        if (!isPremium && metrics.total > 50 * 1024 * 1024) {
          console.warn('[Supabase] Sync blocked: Free cloud memory limit exceeded.');
        } else {
          syncThreadsToSupabase(resolved);
        }
      });
      return resolved;
    });
  };

  `;

  const newContent =
    content.substring(0, startIdx) + newBlock + content.substring(endIdx);
  fs.writeFileSync("WaspAI app/App.js", newContent, "utf8");
  console.log("Fixed App.js successfully!");
}
