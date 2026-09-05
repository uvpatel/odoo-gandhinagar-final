# shadcn/ui Component Engineering

How to initialize, configure, and customize shadcn/ui components in Next.js applications.

---

## ⚡ 1. Initial Setup

Initialize shadcn/ui in a Next.js project:

```bash
npx shadcn@latest init
```

Recommended configuration (`components.json`):
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

---

## 📦 2. Adding Components

Install individual components on-demand:

```bash
npx shadcn@latest add button dialog dropdown-menu input label form table sonner
```

---

## 📋 3. Type-Safe Form Example

Using React Hook Form, Zod, and shadcn `Form` primitives:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ProfileFormSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
});

type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

export function ProfileForm({ onSubmit }: { onSubmit: (data: ProfileFormValues) => void }) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>Public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  );
}
```
