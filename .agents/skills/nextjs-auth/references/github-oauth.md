# GitHub OAuth Integration Guide

Step-by-step instructions for configuring and implementing GitHub OAuth authentication with Next.js and Better Auth.

---

## 🛠️ 1. GitHub Developer Settings

1. Navigate to **GitHub Settings** > **Developer settings** > **OAuth Apps** > **New OAuth App**.
2. Fill out the application details:
   - **Application name**: `Your App Name (Dev / Prod)`
   - **Homepage URL**: `http://localhost:3000` (for local development) or `https://yourapp.com`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github` (or `https://yourapp.com/api/auth/callback/github`)
3. Click **Register application**.
4. Copy the **Client ID** and generate a new **Client Secret**.

---

## 🔑 2. Environment Variables

Add the credentials to `.env.local`:

```env
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
BETTER_AUTH_SECRET="a_random_32_character_string_for_encryption"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🚀 3. Implementing the Login Button

```tsx
// src/features/auth/components/github-login-button.tsx
"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Github, Loader2 } from "lucide-react";

export function GithubLoginButton() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signIn.social({
        provider: "github",
        callbackURL: "/dashboard",
      });
    } catch (error) {
      console.error("Failed to sign in with GitHub:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSignIn}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Github className="h-4 w-4" />
      )}
      Continue with GitHub
    </Button>
  );
}
```

---

## ⚠️ Common Pitfalls

- **Callback URL Mismatch**: Ensure the callback path exactly matches `/api/auth/callback/github`.
- **Private Emails**: GitHub users can hide their primary email. Better Auth handles fetching primary verified emails automatically when scopes include `user:email`.
