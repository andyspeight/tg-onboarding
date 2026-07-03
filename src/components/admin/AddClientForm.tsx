"use client";

import { useState } from "react";

const inputClasses =
  "h-11 w-full rounded-md border border-border bg-surface px-3.5 text-[15px] text-fg placeholder:text-fg-faint transition-[border-color,box-shadow] focus:border-accent-bright focus:outline-none focus:ring-[3px] focus:ring-accent-bright/15";

function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
  }).format(new Date());
}

/**
 * Creates the client and stamps out their six-phase journey for the
 * chosen package. Portal access codes are issued afterwards from the
 * client detail's Portal access card.
 */
export function AddClientForm() {
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [plan, setPlan] = useState("Boost");
  const [accountManager, setAccountManager] = useState("Andy Speight");
  const [startDate, setStartDate] = useState(todayIso);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSessionExpired(false);
    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          contactName,
          contactEmail,
          plan,
          accountManager,
          startDate,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        clientId?: string;
      } | null;
      if (response.ok && payload?.clientId) {
        window.location.assign(`/admin/clients/${payload.clientId}`);
        return;
      }
      setSessionExpired(response.status === 401);
      setError(
        response.status === 401
          ? "Your sign-in has expired. Sign back in (opens in a new tab), then press Create again — everything you’ve typed here is kept."
          : response.status === 400
            ? "Check the details. Something there isn’t valid."
            : "That didn’t save. Try again in a moment.",
      );
    } catch {
      setError("That didn’t save. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="nc-company" className="mb-1.5 block text-[13px] font-medium text-fg">
          Company<span aria-hidden className="text-danger"> *</span>
        </label>
        <input
          id="nc-company"
          type="text"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          required
          maxLength={100}
          placeholder="e.g. Coastline Cruises"
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor="nc-contact" className="mb-1.5 block text-[13px] font-medium text-fg">
          Contact name<span aria-hidden className="text-danger"> *</span>
        </label>
        <input
          id="nc-contact"
          type="text"
          value={contactName}
          onChange={(event) => setContactName(event.target.value)}
          required
          maxLength={100}
          placeholder="e.g. Jo Harper"
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor="nc-email" className="mb-1.5 block text-[13px] font-medium text-fg">
          Contact email<span aria-hidden className="text-danger"> *</span>
        </label>
        <input
          id="nc-email"
          type="email"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          required
          maxLength={150}
          placeholder="name@company.co.uk"
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor="nc-plan" className="mb-1.5 block text-[13px] font-medium text-fg">
          Package<span aria-hidden className="text-danger"> *</span>
        </label>
        <select
          id="nc-plan"
          value={plan}
          onChange={(event) => setPlan(event.target.value)}
          required
          className={`cursor-pointer ${inputClasses}`}
        >
          <option value="Spark">Spark</option>
          <option value="Boost">Boost</option>
          <option value="Ignite">Ignite</option>
        </select>
      </div>
      <div>
        <label htmlFor="nc-manager" className="mb-1.5 block text-[13px] font-medium text-fg">
          Account manager
        </label>
        <input
          id="nc-manager"
          type="text"
          value={accountManager}
          onChange={(event) => setAccountManager(event.target.value)}
          maxLength={100}
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor="nc-start" className="mb-1.5 block text-[13px] font-medium text-fg">
          Start date<span aria-hidden className="text-danger"> *</span>
        </label>
        <input
          id="nc-start"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          required
          className={inputClasses}
        />
      </div>

      <div className="flex items-center justify-end gap-3 sm:col-span-2">
        {error && (
          <p aria-live="polite" className="text-[13px] font-medium text-danger">
            {error}
            {sessionExpired && (
              <>
                {" "}
                <a
                  href="/admin/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline underline-offset-2"
                >
                  Staff login ↗
                </a>
              </>
            )}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="press h-11 cursor-pointer rounded-md bg-accent px-6 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-default disabled:opacity-60"
        >
          {busy ? "Setting up..." : "Create client & journey"}
        </button>
      </div>
    </form>
  );
}
