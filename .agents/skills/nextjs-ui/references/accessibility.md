# Web Accessibility (a11y) Guidelines for Next.js

Building accessible, inclusive web applications adhering to WCAG 2.2 Level AA requirements.

---

## ♿ 1. Key Accessibility Principles

1. **Semantic HTML First**: Use `<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`, `<article>`, `<button>`, and `<a>` instead of arbitrary clickable `<div>` elements.
2. **Keyboard Navigability**: Every interactive element must be reachable and operable using `Tab`, `Enter`, `Space`, and arrow keys.
3. **Visible Focus Rings**: Never remove focus outlines without providing a distinct custom focus indicator (`focus-visible:ring-2 focus-visible:ring-offset-2`).
4. **Color Contrast**: Maintain at least `4.5:1` contrast ratio for normal text and `3:1` for large text and UI components against background colors.

---

## 🏷️ 2. Accessible Icon Buttons & Modals

### Icon-Only Buttons
Always provide accessible labels for screen readers when buttons have no visible text:

```tsx
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({ onDelete }: { onDelete: () => void }) {
  return (
    <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete item">
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Delete item</span>
    </Button>
  );
}
```

---

## 💬 3. Live Regions & Dynamic Notifications

Announce asynchronous updates (like toast alerts or dynamic form errors) using ARIA live regions:

```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>
```

---

## 🧪 4. Accessibility Testing Checklist

- [ ] Interactive elements work with keyboard only (`Tab`, `Shift+Tab`, `Space`, `Enter`, `Escape`).
- [ ] Modals trap focus inside when open and restore focus to trigger button upon closing.
- [ ] Images have descriptive `alt` attributes (`alt=""` if purely decorative).
- [ ] Forms have explicitly associated labels (`<Label htmlFor="id">` and `<Input id="id">`).
- [ ] No automated a11y violations detected in automated axe-core scans.
