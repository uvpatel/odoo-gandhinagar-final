# Server vs. Client Components Deep Dive

React Server Components (RSC) enable rendering UI on the server with zero client bundle impact, while Client Components provide interactivity.

---

## ⚖️ When to Use Which

```
+-----------------------------------+--------------------+--------------------+
| Capability                        | Server Component   | Client Component   |
+-----------------------------------+--------------------+--------------------+
| Data fetching (DB, ORM, Internal) | ✅ Direct & Fast   | ❌ Extra API round |
| Secret keys / Tokens              | ✅ Safe & Secure   | ❌ Leaked to browser|
| Large server dependencies         | ✅ Zero bundle KB  | ❌ Increases bundle|
| State (`useState`, `useReducer`)  | ❌ Not allowed     | ✅ Supported       |
| Effects (`useEffect`)             | ❌ Not allowed     | ✅ Supported       |
| Event listeners (`onClick`, etc.) | ❌ Not allowed     | ✅ Supported       |
| Browser APIs (`window`, etc.)     | ❌ Not allowed     | ✅ Supported       |
| Custom hooks                      | ❌ Not allowed     | ✅ Supported       |
+-----------------------------------+--------------------+--------------------+
```

---

## 🧩 Composition Pattern: Passing Server Components to Client Components

You cannot import a Server Component directly into a Client Component. Instead, pass the Server Component as `children` or as a prop.

### ❌ Anti-pattern (Breaks RSC benefits):
```tsx
// ClientComponent.tsx
"use client";
import ServerComponent from "./ServerComponent"; // ❌ Forces ServerComponent to become a Client Component!

export function ClientContainer() {
  return (
    <div>
      <ServerComponent />
    </div>
  );
}
```

### ✅ Correct Pattern (Slot / Children Pattern):
```tsx
// ClientContainer.tsx
"use client";

import { useState } from "react";

export function ClientContainer({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4 border rounded">
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && children}
    </div>
  );
}
```

```tsx
// Page.tsx (Server Component)
import { ClientContainer } from "./ClientContainer";
import { ServerHeavyList } from "./ServerHeavyList";

export default async function Page() {
  return (
    <ClientContainer>
      <ServerHeavyList /> {/* ✅ Rendered on server with 0 client JS */}
    </ClientContainer>
  );
}
```

---

## ⚠️ Serialization Rules

When passing props from Server Components to Client Components:
- Props must be serializable to JSON (Strings, Numbers, Booleans, plain Objects, Arrays, Dates).
- **Functions, Classes, Symbols, and Promises** cannot be passed directly across the boundary (except Server Actions via `"use server"`).

---

## 🌊 Preventing Client Fetch Waterfalls

Avoid fetching data in `useEffect` inside nested client components. Fetch at the Server Component root and pass down the serialized data or stream components with Suspense.
