"use client";

import Link from "next/link";
import { useState } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import type { AdminClientSummary, HealthLevel } from "@/lib/onboarding/health";

const HEALTH_META: Record<
  HealthLevel,
  { label: string; dot: string; tint: string }
> = {
  green: { label: "On track", dot: "bg-success", tint: "" },
  amber: {
    label: "Slowing",
    dot: "bg-warning",
    tint: "border-warning-border bg-warning-soft",
  },
  red: {
    label: "At risk",
    dot: "bg-danger",
    tint: "border-danger-border bg-danger-soft",
  },
};

const FILTERS: { id: HealthLevel | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "green", label: "On track" },
  { id: "amber", label: "Slowing" },
  { id: "red", label: "At risk" },
];

function ClientAvatar({
  logoUrl,
  company,
}: {
  logoUrl?: string;
  company: string;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className="h-8 w-8 shrink-0 rounded-md border border-border bg-white object-contain"
      />
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-[12px] font-bold text-accent">
      {company.charAt(0).toUpperCase()}
    </span>
  );
}

function HealthDot({ health }: { health: HealthLevel }) {
  const meta = HEALTH_META[health];
  return (
    <span className="inline-flex items-center" title={meta.label}>
      <span
        className={`h-2.5 w-2.5 rounded-full ${meta.dot} ring-2 ring-current/10`}
      />
      <span className="sr-only">{meta.label}</span>
    </span>
  );
}

/** The wilting-watch overview: stats, alerts, and every client's health. */
export function Overview({ clients }: { clients: AdminClientSummary[] }) {
  const [filter, setFilter] = useState<HealthLevel | "all">("all");

  const atRisk = clients.filter((client) => client.health !== "green");
  const avgPct =
    clients.length === 0
      ? 0
      : Math.round(
          clients.reduce((sum, client) => sum + client.pct, 0) / clients.length,
        );
  const overdueTotal = clients.reduce(
    (sum, client) => sum + client.overdueCount,
    0,
  );
  const unreadTotal = clients.reduce(
    (sum, client) => sum + client.unreadMessages,
    0,
  );

  const stats = [
    { label: "Active onboardings", value: String(clients.length), cls: "text-accent" },
    { label: "Average progress", value: `${avgPct}%`, cls: "text-info" },
    {
      label: "At risk",
      value: String(atRisk.length),
      cls: atRisk.length > 0 ? "text-warning" : "text-fg-faint",
    },
    {
      label: "Overdue tasks",
      value: String(overdueTotal),
      cls: overdueTotal > 0 ? "text-danger" : "text-fg-faint",
    },
    {
      label: "Unread messages",
      value: String(unreadTotal),
      cls: unreadTotal > 0 ? "text-accent" : "text-fg-faint",
    },
  ];

  const visible =
    filter === "all"
      ? clients
      : clients.filter((client) => client.health === filter);

  return (
    <div className="space-y-7">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="anim-fade-up rounded-card border border-border bg-surface px-3 py-4 text-center shadow-soft"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <dd
              className={`text-[28px] font-extrabold leading-none tracking-tight tabular-nums ${stat.cls}`}
            >
              {stat.value}
            </dd>
            <dt className="mt-1.5 text-[11px] font-medium text-fg-muted">
              {stat.label}
            </dt>
          </div>
        ))}
      </dl>

      {atRisk.length > 0 && (
        <section className="anim-fade-up">
          <h2 className="mb-2.5 text-[13px] font-bold text-fg">
            Wilting alerts
          </h2>
          <ul className="space-y-2">
            {atRisk.map((client) => (
              <li
                key={client.id}
                className={`flex items-center gap-3 rounded-card border px-4 py-3 ${HEALTH_META[client.health].tint}`}
              >
                <HealthDot health={client.health} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-fg">
                    {client.company}{" "}
                    <span className="font-normal text-fg-muted">
                      ({client.contactName})
                    </span>
                  </p>
                  <p className="mt-0.5 text-[12px] text-fg-muted">
                    {client.reasons.join(". ")}.
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="anim-fade-up">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-bold text-fg">All clients</h2>
          <div role="group" aria-label="Filter clients by health" className="flex gap-1.5">
            {FILTERS.map(({ id, label }) => {
              const active = filter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  aria-pressed={active}
                  className={`press h-8 cursor-pointer rounded-full border px-3 text-[12px] font-medium transition-colors ${
                    active
                      ? "border-accent bg-accent text-accent-contrast"
                      : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-soft">
          <div className="hidden gap-3 border-b border-border px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-fg-faint sm:flex">
            <span className="w-3" />
            <span className="flex-1">Client</span>
            <span className="w-24 text-center">Progress</span>
            <span className="w-32 text-center">Phase</span>
            <span className="w-16 text-center">Intake</span>
            <span className="w-20 text-center">Quiet</span>
            <span className="w-14" />
          </div>
          <ul className="divide-y divide-border">
            {visible.map((client) => (
              <li
                key={client.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap"
              >
                <HealthDot health={client.health} />
                <ClientAvatar logoUrl={client.logoUrl} company={client.company} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-[13px] font-semibold text-fg">
                    {client.company}
                    {client.unreadMessages > 0 && (
                      <span
                        title={`${client.unreadMessages} unread message${client.unreadMessages === 1 ? "" : "s"}`}
                        className="shrink-0 rounded-full bg-accent px-1.5 py-px text-[9px] font-bold text-accent-contrast"
                      >
                        {client.unreadMessages} new
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-fg-muted">
                    {client.contactName}
                    {client.plan ? ` · ${client.plan}` : ""}
                  </p>
                </div>
                <div className="w-24 text-center">
                  <p className="text-[13px] font-bold tabular-nums text-fg">
                    {client.pct}%
                  </p>
                  <ProgressBar
                    value={client.pct}
                    size="sm"
                    label={`${client.company} progress`}
                    className="mx-auto mt-1 max-w-[56px]"
                  />
                </div>
                <div className="w-32 text-center">
                  <p className="truncate text-[12px] text-fg-muted">
                    {client.phaseTitle}
                  </p>
                  <p className="text-[10px] text-fg-faint">
                    Day {client.dayCount}
                  </p>
                </div>
                <p className="w-16 text-center text-[12px] tabular-nums text-fg-muted">
                  {client.intakePct}%
                </p>
                <p className="w-20 text-center text-[12px] tabular-nums text-fg-muted">
                  {client.daysQuiet}d
                </p>
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="press w-14 shrink-0 rounded-md border border-border px-2.5 py-1 text-center text-[11px] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                >
                  Open
                </Link>
              </li>
            ))}
            {visible.length === 0 && (
              <li className="px-4 py-8 text-center text-[13px] text-fg-muted">
                No clients match this filter.
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
