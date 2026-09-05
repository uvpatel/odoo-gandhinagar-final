# Tailwind CSS Architecture & Styling Reference

Mastering theme tokens, CSS variables, dark mode styling, and micro-animations in Next.js.

---

## 🎨 1. Semantic CSS Variables Theme

Define semantic color roles in `src/app/globals.css` to allow smooth dark/light mode switches:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
}
```

---

## 🛠️ 2. Utility Class Merging with `cn()`

Always use `clsx` and `tailwind-merge` to merge conditional classes without specificity clashes:

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## ✨ 3. Layout Patterns

### Responsive Grid
```tsx
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {items.map((item) => (
    <Card key={item.id} className="p-4 transition-all hover:shadow-md">
      <h3>{item.title}</h3>
    </Card>
  ))}
</div>
```

### Centered Hero Section with Fluid Padding
```tsx
<section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
  <div className="flex flex-col items-center text-center space-y-4">
    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
      Next-Gen Fullstack Skills
    </h1>
    <p className="max-w-2xl text-lg text-muted-foreground">
      Production-ready workflows and architectural blueprints for engineering teams.
    </p>
  </div>
</section>
```
