# AI Tool & Function Calling in Next.js

Empowering AI models to execute structured tools, fetch live data, query databases, and trigger business actions.

---

## 🛠️ 1. Defining Server Tools with Zod Schemas

```typescript
// src/app/api/chat/route.ts
import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-1.5-pro-latest"),
    messages,
    tools: {
      getWeather: tool({
        description: "Get the current weather for a given city location",
        parameters: z.object({
          city: z.string().describe("The name of the city, e.g. San Francisco, CA"),
          unit: z.enum(["celsius", "fahrenheit"]).default("celsius"),
        }),
        execute: async ({ city, unit }) => {
          // Fetch from internal service or external weather API
          return {
            city,
            temperature: unit === "celsius" ? 22 : 72,
            conditions: "Sunny with light breeze",
          };
        },
      }),
      searchDatabase: tool({
        description: "Search internal database for documents or records",
        parameters: z.object({
          query: z.string().describe("Search keywords"),
          limit: z.number().default(5),
        }),
        execute: async ({ query, limit }) => {
          // Perform vector search or relational query
          return [
            { id: "doc-1", title: `Result for ${query}`, score: 0.94 },
          ];
        },
      }),
    },
    maxSteps: 5, // Allow multi-step tool reasoning loops
  });

  return result.toDataStreamResponse();
}
```

---

## 🔁 2. Multi-Step Autonomous Reasoning Loops

Setting `maxSteps: 5` enables the model to:
1. Receive user prompt.
2. Call `searchDatabase` tool.
3. Receive search results back.
4. Call another tool or generate final answer.
5. Stream final synthesized response to the user.

---

## 🖥️ 3. Client-Side Tool Invocations

When a tool requires client context (e.g. asking for user geolocation, rendering a confirmation dialog, or copying to clipboard):

```typescript
const result = streamText({
  model: google("gemini-1.5-pro"),
  tools: {
    requestUserConfirmation: tool({
      description: "Ask the user to confirm a dangerous action",
      parameters: z.object({
        actionDescription: z.string(),
      }),
      // Omit execute on server -> model returns tool invocation to client
    }),
  },
});
```
