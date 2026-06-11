"use client";

import { useState } from "react";

/** Client portal sign-in: email + the access code their team issued. */
export function ClientLoginForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/client-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (response.ok) {
        window.location.assign("/");
        return;
      }
      setError(
        response.status === 401
          ? "That email and code don’t match. Check both and try again."
          : response.status === 429
            ? "Too many tries. Give it a minute, then have another go."
            : "Sign-in isn’t available right now. Try again in a moment.",
      );
    } catch {
      setError("Sign-in isn’t available right now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "h-11 w-full rounded-md border border-border bg-surface px-3.5 text-[15px] text-fg placeholder:text-fg-faint transition-[border-color,box-shadow] focus:border-accent-bright focus:outline-none focus:ring-[3px] focus:ring-accent-bright/15";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label
          htmlFor="client-email"
          className="mb-1.5 block text-[13px] font-medium text-fg"
        >
          Email
        </label>
        <input
          id="client-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          maxLength={200}
          autoComplete="email"
          placeholder="you@yourcompany.co.uk"
          className={inputCls}
        />
      </div>

      <div>
        <label
          htmlFor="client-code"
          className="mb-1.5 block text-[13px] font-medium text-fg"
        >
          Access code
        </label>
        <input
          id="client-code"
          type="password"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          required
          maxLength={40}
          autoComplete="current-password"
          placeholder="TG-XXXXX-XXXXX-XXXXX"
          className={inputCls}
        />
        <p className="mt-1.5 text-[12px] text-fg-faint">
          It came from your Travelgenix account manager. Misplaced it? Just
          ask and we’ll issue a fresh one.
        </p>
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
        {busy ? "Checking..." : "Open my portal"}
      </button>
    </form>
  );
}
