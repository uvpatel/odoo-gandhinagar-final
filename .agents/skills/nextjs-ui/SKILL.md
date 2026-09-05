---
name: nextjs-ui
description: UI and component development in Next.js with shadcn/ui, Tailwind CSS (v4/v3), Radix UI, animations, accessibility (a11y), and responsive design.
---

# Next.js UI Engineering Skill

This skill guides the construction of accessible, responsive, composable, and visually polished user interfaces in Next.js using shadcn/ui primitives, Tailwind CSS styling, Radix UI accessibility, and micro-interactions.

---

## 🎨 Core Principles

1. **Copy-Paste Component Ownership**: Own your component code using shadcn/ui rather than relying on heavy monolithic UI libraries.
2. **Accessibility-First**: Ensure full keyboard navigation, screen reader support, correct ARIA roles, and compliant color contrast ratios (WCAG 2.2 AA).
3. **Design Tokens via CSS Variables**: Use semantic color classes (`bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`) to enable seamless dark/light mode switching.
4. **Fluid Responsiveness**: Design mobile-first using responsive Tailwind utility classes (`sm:`, `md:`, `lg:`, `xl:`) and container queries where appropriate.

---

## 📂 Topic References

- [shadcn/ui Primitives & Patterns](./references/shadcn.md): Initialization, component installation, customization, form handling with React Hook Form & Zod, and modal workflows.
- [Tailwind CSS Architecture](./references/tailwind.md): Theme setup, CSS variable design tokens, typography, layout utilities, and animation integration.
- [Web Accessibility (a11y)](./references/accessibility.md): Focus management, keyboard traps prevention, screen reader labeling, semantic HTML, and contrast validation.

---

## 🧩 UI Component Architecture Stack

```
+-------------------------------------------------------------+
| Feature Components (e.g. ProjectCard, UserBillingTable)     |
+-------------------------------------------------------------+
| shadcn/ui Primitives (Button, Dialog, Dropdown, Table, Form)|
+-------------------------------------------------------------+
| Radix UI Headless Primitives (Focus, State, Keyboard events)|
+-------------------------------------------------------------+
| Tailwind CSS Styling (Utility classes & CSS variables)      |
+-------------------------------------------------------------+
```
