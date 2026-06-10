"use client";

import { useState } from "react";

/** Interim staff passcode form; Control SSO replaces this when revived. */
export function LoginForm() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (response.ok) {
        window.location.assign("/admin");
        return;
      }
      setError(
        response.status === 401
          ? "That passcode isn’t right."
          : "Sign-in isn’t available right now. Try again in a moment.",
      );
    } catch {
      setError("Sign-in isn’t available right now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label
          htmlFor="admin-passcode"
          className="mb-1.5 block text-[13px] font-medium text-fg"
        >
          Staff passcode
        </label>
        <input
          id="admin-passcode"
          type="password"
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          required
          maxLength={200}
          autoComplete="current-password"
          className="h-11 w-full rounded-md border border-border bg-surface px-3.5 text-[15px] text-fg transition-[border-color,box-shadow] focus:border-accent-bright focus:outline-none focus:ring-[3px] focus:ring-accent-bright/15"
        />
      </div>

      {error && (
        <p aria-live="polite" className="text-[13px] font-medium text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="press h-11 w-full cursor-pointer rounded-md bg-accent text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-default disabled:opacity-60"
      >
        {busy ? "Checking..." : "Sign in"}
      </button>
    </form>
  );
}
