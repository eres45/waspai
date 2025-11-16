# Pollinations AI - Model Features Analysis

## Test Results

### 1. **openai-reasoning** (OpenAI o4 Mini)

#### Response Structure

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "1. Rewrite the expression...\n2. Compute the multiplication...\n3. Add 25...",
        "annotations": [],
        "refusal": null
      },
      "finish_reason": "stop",
      "index": 0
    }
  ],
  "id": "pllns_...",
  "model": "gpt-4o-mini",
  "created": 1763132153,
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 150,
    "total_tokens": 160
  }
}
```

#### How Reasoning is Returned

- **Location**: `choices[0].message.content`
- **Format**: The reasoning is included directly in the content as plain text
- **Structure**: Step-by-step reasoning is formatted with numbered steps and line breaks
- **No separate field**: Unlike some models, there's NO separate `reasoning` field
- **Integration**: The reasoning is part of the main response content

#### Example Output

```
1. Rewrite the expression to clarify the order of operations:
   (15 × 8) + 25
2. Compute the multiplication first:
   15 × 8 = 120
3. Add 25 to that result:
   120 + 25 = 145

So, 15 * 8 + 25 = 145.
```

#### Implementation Notes

- The model naturally includes reasoning in its responses
- No special parsing needed - just use the `content` field
- The reasoning is already formatted for display
- Response time: ~7-8 seconds (slower due to reasoning)

---

### 2. **gemini-search** (Gemini 2.5 Flash Lite with Google Search)

#### Response Structure

```json
{
  "id": "pllns_43ece17edd1ee90313647523480d0fd5",
  "object": "chat.completion",
  "created": 1763132168,
  "model": "gemini-2.5-flash-lite",
  "provider": "vertex-ai",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "A significant trend in 2024 was the continued evolution..."
      },
      "finish_reason": "stop",
      "index": 0
    }
  ],
  "usage": {
    "prompt_tokens": 8,
    "completion_tokens": 250,
    "total_tokens": 258
  }
}
```

#### How Search Results are Returned

- **Location**: `choices[0].message.content`
- **Format**: Search results are integrated into the response content
- **No separate field**: There's NO separate `search_results` field at top level or in message
- **Integration**: The model synthesizes search results into its response
- **Citations**: Search results are referenced within the content text

#### Example Output

```
A significant trend in 2024 was the continued evolution and advancement
of generative AI chatbots, with new features like memory and multimodal
capabilities emerging. Companies like OpenAI, Google, and Meta have all
released or updated their chatbot offerings, with OpenAI's GPT-4o being
a notable innovation. Apple also made a significant entry into the
generative AI space with the launch of Apple Intelligence...

In terms of hardware, NVIDIA's Blackwell architecture for GPUs became a
sought-after standard for AI processing...
```

#### Implementation Notes

- Search results are automatically integrated into the response
- No separate parsing needed for search results
- The model provides a synthesized answer with search context
- Response time: ~4-5 seconds
- Best for: Current events, recent news, up-to-date information

---

### 3. **openai-audio** (OpenAI GPT-4o Mini Audio Preview)

#### Status: ❌ NOT WORKING with current API

#### Error Response

```json
{
  "error": "400 Bad Request",
  "status": 400,
  "details": {
    "error": {
      "message": "azure-openai error: This model requires that either input content or output modality contain audio.",
      "type": "invalid_request_error",
      "param": "model",
      "code": "invalid_value"
    },
    "provider": "azure-openai"
  }
}
```

#### Why It Fails

- **Requires Audio Input/Output**: The model expects audio in the request
- **Current Implementation**: Standard text-only chat format doesn't work
- **Missing Support**: Pollinations API doesn't expose audio input/output through the standard OpenAI endpoint

#### What Would Be Needed

```javascript
// This would be the expected format (not currently supported):
{
  "model": "openai-audio",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Say hello"
        },
        {
          "type": "audio",
          "audio": "base64_encoded_audio_data"
        }
      ]
    }
  ],
  "modalities": ["text", "audio"],  // Request audio output
  "audio": {
    "voice": "alloy",
    "format": "mp3"
  }
}
```

#### Recommendation

- **Remove from model menu** for now
- Audio support requires a different API endpoint or implementation
- Consider using text-to-speech separately if audio output is needed

---

## Summary Table

| Model            | Feature                | Status         | Response Location | Notes                                            |
| ---------------- | ---------------------- | -------------- | ----------------- | ------------------------------------------------ |
| openai-reasoning | Step-by-step reasoning | ✅ Working     | `message.content` | Integrated in content, no separate field         |
| gemini-search    | Search results         | ✅ Working     | `message.content` | Synthesized into response, no separate field     |
| openai-audio     | Audio I/O              | ❌ Not Working | N/A               | Requires audio input format not supported by API |

---

## Implementation Guide

### For Reasoning Model

```typescript
// Just use the content directly
const response = await chat({
  model: "openai-reasoning",
  messages: [{ role: "user", content: "Solve this step by step..." }],
});

const reasoning = response.choices[0].message.content;
// Already formatted with step-by-step reasoning
```

### For Search Model

```typescript
// Just use the content directly
const response = await chat({
  model: "gemini-search",
  messages: [{ role: "user", content: "What's the latest news?" }],
});

const answer = response.choices[0].message.content;
// Already includes search results synthesized into the answer
```

### For Audio Model

```typescript
// Currently not supported - would need custom implementation
// Consider alternatives:
// 1. Use text-to-speech service separately
// 2. Wait for Pollinations to add audio endpoint support
// 3. Use a different provider for audio
```

---

## Recommendations

1. **Keep openai-reasoning**: Works perfectly, reasoning is naturally included
2. **Keep gemini-search**: Works perfectly, search results are synthesized
3. **Remove openai-audio**: Not functional with current API, requires audio format support
4. **Update model list** to only include the 8 working models:
   - gemini
   - gemini-search
   - mistral
   - openai
   - openai-fast
   - openai-large
   - openai-reasoning
   - roblox-rp
