# Agents, MCP, and Workflows - Complete Guide

**Date:** November 20, 2025  
**Status:** ✅ All Fixed and Ready to Use

---

## 🎯 Quick Overview

| Feature | Purpose | Where to Use | Complexity |
|---------|---------|--------------|-----------|
| **Agents** | Custom AI personalities with instructions | Chat mentions (`@agent-name`) | Easy |
| **MCP** | Connect external tools and services | Chat mentions (`@tool-name`) | Medium |
| **Workflows** | Chain multiple tools together | Trigger in chat | Advanced |

---

## 1️⃣ AGENTS - Custom AI Personalities

### What Are Agents?

Agents are custom AI personalities with specific instructions and roles. Think of them as different "modes" for the AI.

**Examples:**
- **Code Expert Agent** - Specializes in writing and debugging code
- **Writer Agent** - Focuses on creative writing and content
- **Teacher Agent** - Explains concepts in educational style
- **Translator Agent** - Translates between languages

### How to Create an Agent

**Step 1: Go to Agents Page**
```
URL: /agents
```

**Step 2: Click "Create New Agent"**
- **Name:** Give it a unique name (e.g., "Code Expert")
- **Description:** What this agent does
- **Icon:** Pick an emoji (e.g., 💻)
- **Instructions:** Write detailed instructions for the AI
  - Example: "You are a Python expert. Always provide clean, well-documented code with explanations."
- **Visibility:** Private (only you) or Public (everyone can use)

**Step 3: Save**

### How to Use an Agent in Chat

**Method 1: Mention in Chat**
```
@Code-Expert help me debug this Python function
```

**Method 2: Select from Dropdown**
- Click the agent selector dropdown
- Choose your agent
- Then type your message

### What Happens When You Use an Agent

```
User: "@Code-Expert fix this bug"
↓
AI loads agent instructions
↓
AI uses agent's personality and instructions
↓
AI responds as the Code Expert
↓
Response includes code expertise
```

### Agent Instructions Best Practices

```
✅ GOOD:
"You are a Python expert with 10 years of experience. 
Always provide:
1. Clean, readable code
2. Explanations of what the code does
3. Performance considerations
4. Error handling examples"

❌ BAD:
"Help with code"
```

---

## 2️⃣ MCP - Model Context Protocol (External Tools)

### What Is MCP?

MCP connects your chatbot to external tools and services. It's like giving the AI access to plugins.

**Examples:**
- **Filesystem Tool** - Read/write files on your computer
- **Database Tool** - Query databases
- **API Tool** - Call external APIs
- **Calculator Tool** - Complex calculations
- **Custom Tools** - Your own integrations

### How to Add an MCP Server

**Step 1: Go to MCP Page**
```
URL: /mcp
```

**Step 2: Click "Add MCP Server"**

**Step 3: Choose Connection Type**

#### Option A: STDIO (Local Process)
```json
{
  "command": "node",
  "args": ["index.js"],
  "env": {
    "API_KEY": "your-key"
  }
}
```
- Runs a local program
- Best for: Custom tools, local services

#### Option B: HTTP (Remote Server)
```json
{
  "url": "https://api.example.com",
  "headers": {
    "Authorization": "Bearer token"
  }
}
```
- Connects to a remote server
- Best for: Cloud services, APIs

**Step 4: Name and Save**
- Give it a name (e.g., "Filesystem")
- MCP will connect and discover available tools

### How to Use MCP Tools in Chat

**Method 1: Mention Tool**
```
@filesystem read-file /path/to/file.txt
```

**Method 2: Let AI Choose**
```
User: "Read the config file and tell me the database URL"
↓
AI sees filesystem tool is available
↓
AI automatically calls the tool
↓
AI reads the file and responds
```

### What Happens When You Use MCP

```
User: "@filesystem read-file config.json"
↓
AI calls MCP server
↓
MCP server executes the tool
↓
Tool returns result (file contents)
↓
AI processes and responds to user
```

### Popular MCP Servers

1. **Filesystem** - Read/write files
2. **Database** - Query databases
3. **Git** - Git operations
4. **Weather** - Get weather data
5. **News** - Fetch news articles

---

## 3️⃣ WORKFLOWS - Chain Tools Together

### What Are Workflows?

Workflows are sequences of tools that run in order. Each tool's output becomes the next tool's input.

**Examples:**
- **Email Workflow:** Get emails → Filter → Summarize → Send response
- **Data Processing:** Read CSV → Transform → Validate → Save
- **Content Creation:** Research topic → Write draft → Edit → Publish

### How to Create a Workflow

**Step 1: Go to Workflows Page**
```
URL: /workflows
```

**Step 2: Click "Create New Workflow"**

**Step 3: Add Nodes (Steps)**

Each node represents a tool or action:

```
┌─────────────┐
│   INPUT     │ (User provides data)
└──────┬──────┘
       │
┌──────▼──────┐
│  TOOL 1     │ (First action)
└──────┬──────┘
       │
┌──────▼──────┐
│  TOOL 2     │ (Second action)
└──────┬──────┘
       │
┌──────▼──────┐
│   OUTPUT    │ (Final result)
└─────────────┘
```

**Step 4: Connect Nodes**
- Drag from one node to another
- Data flows through the connections

**Step 5: Configure Each Node**
- Set parameters
- Map input/output
- Add conditions if needed

**Step 6: Publish**
- Make it available to use
- Choose visibility (private/public)

### How to Use a Workflow in Chat

**Method 1: Trigger Manually**
```
User: "Run my email workflow"
↓
Workflow executes all steps
↓
AI shows results
```

**Method 2: Let AI Trigger**
```
User: "Process these emails"
↓
AI sees email workflow available
↓
AI automatically triggers it
↓
Workflow runs and returns results
```

### Workflow Example: Summarize Article

```
Step 1: INPUT
├─ User provides article URL

Step 2: FETCH CONTENT
├─ MCP tool fetches article from URL
├─ Returns: Full article text

Step 3: EXTRACT KEY POINTS
├─ AI tool extracts main ideas
├─ Returns: 5-7 key points

Step 4: SUMMARIZE
├─ AI tool creates summary
├─ Returns: 1-2 paragraph summary

Step 5: OUTPUT
├─ Display summary to user
```

---

## 🔄 How They Work Together

### Scenario 1: Using Agent + MCP

```
User: "@Code-Expert use the filesystem tool to read my package.json"
↓
Agent (Code Expert) is loaded
↓
MCP tool (filesystem) is available
↓
AI uses both:
  - Agent's expertise for code analysis
  - MCP tool for file access
↓
Result: Expert code analysis of your package.json
```

### Scenario 2: Using Workflow + Agent

```
User: "Run my content workflow"
↓
Workflow triggers:
  1. Research topic (using web search)
  2. Write draft (using Writer Agent)
  3. Edit content (using Editor Agent)
  4. Format output
↓
Result: Complete, polished content
```

### Scenario 3: All Three Together

```
User: "@Code-Expert run my deployment workflow"
↓
Workflow executes:
  1. Check code quality (MCP tool)
  2. Run tests (MCP tool)
  3. Build project (MCP tool)
  4. Deploy (MCP tool)
↓
Code Expert Agent analyzes each step
↓
Result: Successful deployment with expert review
```

---

## 📊 Comparison Table

| Aspect | Agents | MCP | Workflows |
|--------|--------|-----|-----------|
| **Purpose** | Custom personality | External tools | Chain actions |
| **Setup Time** | 2 minutes | 5 minutes | 10 minutes |
| **Complexity** | Easy | Medium | Advanced |
| **Reusability** | High | High | High |
| **Best For** | Role-playing | Tool access | Automation |
| **Mention Syntax** | `@agent-name` | `@tool-name` | Trigger directly |

---

## ✅ Database Connection Status

### Fixed Issues

✅ **Agents** - Migrated to Supabase REST API  
✅ **MCP** - Migrated to Supabase REST API  
✅ **Workflows** - Added error handling wrapper  

### Why This Matters

- **Before:** Direct PostgreSQL connections failed on Vercel (DNS resolution error)
- **After:** Uses Supabase REST API (works on Vercel free tier)
- **Result:** All three features now work reliably

---

## 🚀 Getting Started Checklist

### For Agents
- [ ] Go to `/agents`
- [ ] Create your first agent
- [ ] Use it in chat with `@agent-name`
- [ ] Customize instructions

### For MCP
- [ ] Go to `/mcp`
- [ ] Add an MCP server
- [ ] Test a tool
- [ ] Use it in chat

### For Workflows
- [ ] Go to `/workflows`
- [ ] Create a simple workflow
- [ ] Connect 2-3 tools
- [ ] Publish and test

---

## 💡 Tips & Tricks

### Agent Tips
- Use specific instructions for better results
- Include examples in instructions
- Test with different prompts
- Iterate on instructions

### MCP Tips
- Start with simple tools (filesystem)
- Test each tool individually first
- Check tool documentation
- Use error messages to debug

### Workflow Tips
- Start simple (2-3 steps)
- Test each step individually
- Use clear node names
- Document your workflows

---

## 🆘 Troubleshooting

### Agents Not Showing
- Refresh the page
- Check if agent is published
- Verify agent name in mention

### MCP Tools Not Available
- Check MCP server connection status
- Verify server configuration
- Check error logs
- Restart MCP server

### Workflows Not Running
- Verify all nodes are connected
- Check node configurations
- Test individual tools first
- Check workflow is published

---

## 📝 Summary

**Agents** = Custom AI personalities  
**MCP** = External tools and services  
**Workflows** = Automated sequences  

All three are now **fully functional** and **database-connected**! 🎉

Start with Agents (easiest), then try MCP, then create Workflows for advanced automation.
