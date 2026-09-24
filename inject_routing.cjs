const fs = require("fs");
const content = fs.readFileSync("WaspAI app/App.js", "utf8");

const targetStr = `      // HYBRID CHAT ROUTING
      if (selectedAgentId) {
        // Route to Next.js API for Custom Agents & Skills
        const payload = {
          messages: [{ role: 'user', content: text }],
          metadata: { agentId: selectedAgentId }
        };
        const nextRes = await API.sendChatMessage(payload);
        const data = await nextRes.json();
        reply = data?.messages?.[data.messages.length - 1]?.content; // Or however the response is formatted
      } else {`;

const replacementStr = `      // HYBRID CHAT ROUTING
      if (selectedAgentId) {
        // Route to Next.js API for Custom Agents & Skills
        const payload = {
          id: currentChatId,
          message: { id: Date.now().toString(), role: 'user', parts: [{ type: 'text', text: text }] },
          toolChoice: 'auto',
          mentions: [{ type: 'agent', id: selectedAgentId, name: 'Agent', skillId: '' }],
          attachments: []
        };
        const nextRes = await API.sendChatMessage(payload);
        const rawText = await nextRes.text();
        
        // Parse Next.js AI SDK Stream chunks (0:"chunk")
        let parsedReply = '';
        const lines = rawText.split('\\n');
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try { parsedReply += JSON.parse(line.substring(2)); } catch(e) {}
          }
        }
        reply = parsedReply;
      } else {`;

if (content.includes(targetStr)) {
  const newContent = content.replace(targetStr, replacementStr);
  fs.writeFileSync("WaspAI app/App.js", newContent, "utf8");
  console.log("Successfully injected Hybrid Routing Logic!");
} else {
  console.log("Target string not found for routing logic!");
}
