"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconBrandGithub } from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [isLoading, setIsLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please check and try again.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await (authClient.signUp.email as any)({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        callbackURL: "/dashboard",
      });

      if (res.error) {
        const errorText =
          res.error.message || "Failed to create account. Please try again.";
        setErrorMessage(errorText);
        toast.error(errorText);
      } else {
        toast.success("Account created successfully! Welcome aboard.");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSignUp = async () => {
    setIsGithubLoading(true);
    setErrorMessage(null);

    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard",
      });
    } catch (err: unknown) {
      setIsGithubLoading(false);
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to authenticate with GitHub.";
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (err: unknown) {
      setIsGoogleLoading(false);
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to authenticate with Google.";
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  const handleUnconfiguredProvider = (providerName: string) => {
    toast.info(`${providerName} registration is not configured yet.`);
  };

  const isBusy = isLoading || isGithubLoading || isGoogleLoading;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleEmailSignUp}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Enter your information below to get started
                </p>
              </div>

              {errorMessage && (
                <FieldError className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-center text-sm">
                  {errorMessage}
                </FieldError>
              )}

              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isBusy}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isBusy}
                />
                <FieldDescription>
                  We&apos;ll never share your email with anyone else.
                </FieldDescription>
              </Field>

              <Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isBusy}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isBusy}
                    />
                  </Field>
                </div>
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="role">Role / Position</FieldLabel>
                <select
                  id="role"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-background"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isBusy}
                >
                  <option value="employee" className="dark:bg-zinc-900">Employee</option>
                  <option value="hr_manager" className="dark:bg-zinc-900">HR Manager</option>
                  <option value="hr_payroll_user" className="dark:bg-zinc-900">HR Payroll User</option>
                  <option value="hr_payroll_manager" className="dark:bg-zinc-900">HR Payroll Manager</option>
                  <option value="admin" className="dark:bg-zinc-900">Administrator</option>
                </select>
                <FieldDescription>
                  Your role determines your workspace access and permissions.
                </FieldDescription>
              </Field>

              <Field>
                <Button type="submit" className="w-full" disabled={isBusy}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>

              <Field className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGithubSignUp}
                  disabled={isBusy}
                  className="w-full flex items-center justify-center gap-2"
                  title="Sign up with GitHub"
                >
                  {isGithubLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <IconBrandGithub className="size-4" />
                  )}
                  <span>GitHub</span>
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={isBusy}
                  className="w-full flex items-center justify-center gap-2"
                  title="Sign up with Google"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4">
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                  <span>Google</span>
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Already have an account?{" "}
                <Link href="/signin" className="underline underline-offset-4 hover:text-primary">
                  Sign in
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholder.svg"
              alt="Sign up banner"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <Link href="#" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </Link>
        .
      </FieldDescription>
    </div>
  );
}