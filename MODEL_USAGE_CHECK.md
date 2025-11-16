# Model Usage Verification

## How to Check Which Model is Being Used

### 1. **Server Logs**
When you send a message, check the server logs for this line:
```
ℹ Chat API:  model: gpt-oss/gpt-oss-120b
```

Or for Pollinations:
```
ℹ Chat API:  model: pollinations/openai
```

### 2. **GPT-OSS API Call Log**
If GPT-OSS 120B is actually being used, you'll see:
```
ℹ GPT-OSS API called: model=gpt-oss-120b, streaming=true, text="Your message..."
```

If this log doesn't appear, it means the model is falling back to Pollinations.

### 3. **Response Quality**
- **GPT-OSS 120B**: Simpler, more direct responses
- **Pollinations OpenAI**: More detailed, structured responses

### 4. **Response Speed**
- **GPT-OSS 120B**: ~1-2 seconds
- **Pollinations OpenAI**: ~4-5 seconds

## Current Setup

### Available Models:
1. **Pollinations** (7 models)
   - gemini
   - mistral
   - openai ← **FALLBACK MODEL**
   - openai-fast
   - openai-large
   - openai-reasoning
   - roblox-rp

2. **GPT-OSS** (2 models)
   - gpt-oss-120b
   - gpt-4-117b

### Fallback Logic:
```typescript
// In /src/lib/ai/models.ts
const fallbackModel = pollinationsModels.openai;

getModel: (model?: ChatModel): LanguageModel => {
  if (!model) return fallbackModel;
  return allModels[model.provider]?.[model.model] || fallbackModel;
}
```

If a model is not found, it falls back to **Pollinations OpenAI**.

## Testing Steps

1. **Select GPT-OSS 120B** from the model menu
2. **Send a message** like "What is 2+2?"
3. **Check server logs** for:
   - `model: gpt-oss/gpt-oss-120b` ← Model selected
   - `GPT-OSS API called:` ← Confirms GPT-OSS is being used
4. **If you don't see the GPT-OSS log**, it's using the fallback (Pollinations OpenAI)

## Debugging

### If GPT-OSS isn't working:
1. Check if `gpt-oss-120b` appears in the model menu
2. Verify the API endpoint is accessible: `https://sii3.top/api/gpt-oss.php`
3. Check server logs for errors
4. Confirm the custom fetch function is being called

### If responses are empty:
1. Streaming might not be working
2. Check if `GPT-OSS API called:` log appears
3. Verify the response is being transformed correctly
4. Check browser console for errors

## Model Comparison

| Feature | GPT-OSS 120B | Pollinations OpenAI |
|---------|--------------|-------------------|
| Speed | Fast (1-2s) | Medium (4-5s) |
| Quality | Good | Excellent |
| Cost | Free | Free (seed tier) |
| Tool Support | ❌ No | ✅ Yes |
| Vision Support | ❌ No | ✅ Yes |
| Streaming | Simulated | Native |
| API Type | Simple JSON | OpenAI-compatible |

## Next Steps

To verify which model is actually being used:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Send a message with GPT-OSS 120B selected
4. Check server terminal for the `GPT-OSS API called:` log
5. If it appears, GPT-OSS is being used
6. If it doesn't appear, Pollinations OpenAI is being used (fallback)
