# Next.js Performance & Core Web Vitals Optimization

Optimizing Next.js for production guarantees superior user experience, SEO rankings, and sub-second page loads.

---

## ⚡ 1. Streaming & React Suspense

Break monolithic page loads into independent streaming segments to prevent slow database queries from blocking the initial page render.

```tsx
import { Suspense } from "react";
import { UserProfile, UserProfileSkeleton } from "@/features/user/components";
import { RecentActivity, ActivitySkeleton } from "@/features/activity/components";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <Suspense fallback={<UserProfileSkeleton />}>
        <UserProfile />
      </Suspense>

      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}
```

---

## 🖼️ 2. Next.js Image Optimization (`next/image`)

To maximize **Largest Contentful Paint (LCP)**:
- Always supply `width` and `height` (or `fill` with `sizes`).
- Add `priority` for above-the-fold hero images.
- Use modern formats (`webp`, `avif`).

```tsx
import Image from "next/image";

export function HeroBanner() {
  return (
    <div className="relative h-96 w-full overflow-hidden">
      <Image
        src="/hero.jpg"
        alt="Platform Dashboard Hero"
        fill
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
        className="object-cover"
      />
    </div>
  );
}
```

---

## 🔤 3. Font Optimization (`next/font`)

Zero Layout Shift (CLS) using automatic font self-hosting:

```typescript
// app/layout.tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

---

## 📦 4. Bundle Optimization & Dynamic Imports

Lazy load heavy client components (charts, rich-text editors, 3D canvases) to keep the initial JavaScript bundle minimal:

```tsx
"use client";

import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("@/components/analytics/heavy-chart"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" />,
});

export function AnalyticsSection() {
  return <HeavyChart />;
}
```

---

## 🚀 5. Cache Strategy & Revalidation

- **Static Fetching**: `fetch(url, { cache: 'force-cache' })` (Default)
- **Time-based Revalidation**: `fetch(url, { next: { revalidate: 3600 } })`
- **On-Demand Tag Revalidation**:
  ```typescript
  // Fetcher
  fetch(url, { next: { tags: ["products"] } });

  // In Server Action / Route Handler after update
  import { revalidateTag } from "next/cache";
  revalidateTag("products");
  ```
