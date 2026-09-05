# Google Gemini Integration in Next.js

Leveraging Google Gemini models for high-speed reasoning, large context windows (up to 2M tokens), multimodal processing, and structured JSON output.

---

## 🔑 1. Environment Setup

```env
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"
```

---

## 🎯 2. Model Selection Guide

- **Gemini 2.5 Pro / Flash**: State-of-the-art reasoning, coding, and multi-step complex tasks.
- **Gemini 1.5 Pro**: High-reasoning tasks with massive context windows (docs, books, codebase analysis).
- **Gemini 1.5 Flash**: Sub-second latency for chats, summarization, and high-frequency tasks.

---

## 📄 3. Structured Outputs with `generateObject`

Extract strongly typed JSON from unstructured text:

```typescript
// src/features/ai/actions/extract-receipt.ts
"use server";

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const ReceiptSchema = z.object({
  merchant: z.string(),
  date: z.string(),
  total: z.number(),
  items: z.array(
    z.object({
      name: z.string(),
      price: z.number(),
      quantity: z.number(),
    })
  ),
});

export async function parseReceipt(imageUrl: string) {
  const result = await generateObject({
    model: google("gemini-1.5-flash"),
    schema: ReceiptSchema,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Extract the line items and total from this receipt image." },
          { type: "image", image: new URL(imageUrl) },
        ],
      },
    ],
  });

  return result.object;
}
```

---

## 🌐 4. Google Search Grounding

Enable real-time search grounding with Gemini:

```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function searchGroundedResponse(prompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return response.text;
}
```
