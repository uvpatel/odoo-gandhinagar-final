# Vercel AI SDK Integration Guide

The Vercel AI SDK is the TypeScript-first toolkit for building AI applications with Next.js, React, and modern LLM providers.

---

## 📦 1. Installation

```bash
npm install ai @ai-sdk/google zod
```

---

## ⚡ 2. API Route Handler with Streaming

```typescript
// src/app/api/chat/route.ts
import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const maxDuration = 30; // Extend serverless timeout for streaming

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-1.5-pro-latest"),
    system: "You are an expert Next.js fullstack software engineer. Provide concise, clean, and modern code examples.",
    messages,
  });

  return result.toDataStreamResponse();
}
```

---

## 💬 3. Client Chat Interface with `useChat`

```tsx
// src/features/ai/components/chat-interface.tsx
"use client";

import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  return (
    <div className="flex h-[600px] w-full max-w-2xl flex-col rounded-lg border bg-background p-4 shadow-sm">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role !== "user" && <Bot className="mt-1 h-5 w-5 text-primary" />}
              <div
                className={`rounded-lg px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && <User className="mt-1 h-5 w-5 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask anything..."
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
```
