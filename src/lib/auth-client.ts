import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
     process.env.BETTER_AUTH_URL  ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"),
    plugins: [
        adminClient()  
    ]
});

export const { signIn, signUp, signOut, useSession } = authClient;