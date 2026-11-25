"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { User, Settings as SettingsIcon, Moon, Sun, Bell, Shield, LogOut, Check } from "lucide-react";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Vancouver",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Stockholm",
  "Europe/Helsinki",
  "Europe/Warsaw",
  "Europe/Bucharest",
  "Europe/Istanbul",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
];

export default function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();

  // Profile form state
  const [fullName, setFullName] = useState(user?.profile?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [timezone, setTimezone] = useState(user?.profile?.timezone || "UTC");
  const [theme, setTheme] = useState<"light" | "dark">(user?.profile?.theme || "light");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password change form state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.profile?.full_name || "");
      setEmail(user.email);
      setTimezone(user.profile?.timezone || "UTC");
      setTheme(user.profile?.theme || "light");
    }
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      await updateProfile({ full_name: fullName, timezone, theme });
      // Apply theme
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("momentum_theme", theme);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: any) {
      setProfileError(err?.message || "Failed to save profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSaved(false);

    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }

    setPwLoading(true);
    try {
      await apiClient("/auth/change-password/", {
        method: "POST",
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err: any) {
      setPwError(err?.message || "Password change failed. Check your current password.");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 pt-2 pb-12 max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="pb-2 border-b border-border/60">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account, preferences, and application settings.
          </p>
        </div>

        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-forest/10 dark:bg-forest-950/50 text-forest dark:text-forest-300 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your display name and timezone settings.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSave} className="space-y-4">
              {profileError && (
                <div className="p-3 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  {profileError}
                </div>
              )}

              <Input
                label="Full Name"
                id="fullName"
                type="text"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <Input
                label="Email Address"
                id="email"
                type="email"
                value={email}
                disabled
                className="opacity-60 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground -mt-2">
                Email changes are not supported in this release.
              </p>

              <Select
                label="Timezone"
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </Select>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 pt-2">
                  {profileSaved && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Saved
                    </span>
                  )}
                </div>
                <Button type="submit" variant="primary" size="sm" isLoading={profileLoading}>
                  Save Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Theme Preference Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gold-50 dark:bg-gold-950/40 text-gold dark:text-gold-400 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Choose your preferred interface theme.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    theme === t
                      ? "border-forest ring-2 ring-forest bg-forest-50 dark:bg-forest-950/40"
                      : "border-border bg-background hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {t === "light" ? (
                    <Sun className="w-6 h-6 text-gold" />
                  ) : (
                    <Moon className="w-6 h-6 text-forest-400" />
                  )}
                  <span className="text-sm font-semibold capitalize text-foreground">{t} Mode</span>
                </button>
              ))}
            </div>
            <div className="pt-4 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleProfileSave}
                isLoading={profileLoading}
              >
                Apply Theme
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Password Management Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sage-100 dark:bg-sage-950/40 text-forest dark:text-sage-300 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password for security.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {pwError && (
                <div className="p-3 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  {pwError}
                </div>
              )}

              <Input
                label="Current Password"
                id="oldPassword"
                type="password"
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
              />

              <Input
                label="New Password (min 8 characters)"
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />

              <Input
                label="Confirm New Password"
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />

              <div className="flex items-center justify-between">
                {pwSaved && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Password updated
                  </span>
                )}
                <div className="ml-auto">
                  <Button type="submit" variant="primary" size="sm" isLoading={pwLoading}>
                    Update Password
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account Management Card (Logout) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your Momentum account session.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border/80">
              <div>
                <p className="text-sm font-semibold text-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-800 gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Build Info */}
        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">
            Momentum MVP · Built for sustainable, non-punitive habit development
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
