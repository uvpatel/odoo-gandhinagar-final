---
name: nextjs-ai
description: AI integration in Next.js using Vercel AI SDK, Google Gemini (via @ai-sdk/google or @google/genai), text/object streaming, tool calling, and multimodal workflows.
---

# Next.js AI Integration Skill

This skill provides guidelines and patterns for building generative AI features into Next.js applications using the Vercel AI SDK and Google Gemini models, supporting real-time streaming, structured JSON generation, tool calling, and multimodal inputs.

---

## 🤖 Core Capabilities

1. **Real-time Streaming**: Deliver low-latency text and UI streams using Server-Sent Events and React Suspense.
2. **Structured Output Extraction**: Generate deterministic, type-safe data structures with `generateObject` / `streamObject` using Zod schemas.
3. **Autonomous Tool Calling**: Empower models to execute TypeScript functions on the server or client to fetch dynamic context, query databases, or invoke external APIs.
4. **Multimodal Reasoning**: Process images, documents (PDFs), audio, and text prompts with Google Gemini 2.5 / 2.0 / 1.5.

---

## 📂 Topic References

- [Vercel AI SDK Core](./references/vercel-ai-sdk.md): Core concepts, provider setup, client hooks (`useChat`, `useCompletion`), and message abstractions.
- [Google Gemini Integration](./references/gemini.md): Gemini model configuration, multimodal prompts, system instructions, and Google Search grounding.
- [Streaming Architecture](./references/streaming.md): Edge & Node runtimes, handling token backpressure, auto-scrolling chat UI, and error recovery.
- [Tool & Function Calling](./references/tool-calling.md): Zod parameter definitions, client vs. server tool execution, and multi-step tool agent loops.

---

## 🏗️ AI Workflow Architecture

```
User Prompt (Client)
       │
       ▼
Next.js Route Handler / Server Action (POST /api/chat)
       │
       ├─► Check Auth & Rate Limiting
       ├─► Inject System Prompt & Dynamic Context
       ├─► Stream to Google Gemini Model (ai-sdk)
       │       │
       │       ├─► [Optional] Model calls Tool (e.g. searchDatabase)
       │       └─► Return Tool Result to Model
       │
       ▼
Streamed Tokens / Structured Objects (SSE)
       │
       ▼
UI Component (`useChat` hook renders real-time stream)
```
