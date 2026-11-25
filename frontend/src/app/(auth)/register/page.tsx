"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Compass, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setIsLoading(false);
      return;
    }

    try {
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      await register(email, password, fullName, detectedTz);
      router.push("/onboarding");
    } catch (err: any) {
      setError(err?.message || "Failed to create account. Please check your information.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-forest text-white shadow-soft">
            <Compass className="w-6 h-6" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Begin your journey with Momentum
          </h1>
          <p className="text-sm text-muted-foreground">
            A thoughtful space designed for real, sustainable personal growth.
          </p>
        </div>

        {/* Registration Card */}
        <Card className="border-border/80 shadow-soft">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Create your account</CardTitle>
            <CardDescription>Start cultivating consistency and healthy routines today.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  {error}
                </div>
              )}

              <Input
                label="Full name"
                id="fullName"
                type="text"
                placeholder="Marcus Aurelius"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <Input
                label="Email address"
                id="email"
                type="email"
                placeholder="you@domain.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

              <Input
                label="Password (min 8 characters)"
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />

              <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-forest dark:text-forest-300 hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Philosophy Note */}
        <div className="text-center">
          <p className="text-xs text-muted-grey flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Build habits. Build yourself.
          </p>
        </div>
      </div>
    </div>
  );
}
