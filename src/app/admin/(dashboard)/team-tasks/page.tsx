import type { Metadata } from "next";
import { TeamTasks } from "@/components/admin/TeamTasks";
import { fetchAdminSnapshot } from "@/lib/onboarding/airtable";

export const metadata: Metadata = {
  title: "Team tasks · Travelgenix onboarding",
  robots: { index: false, follow: false },
};

export default async function TeamTasksPage() {
  const snapshot = await fetchAdminSnapshot();

  return (
    <div className="anim-fade-up">
      <h1 className="text-2xl font-extrabold tracking-tight text-fg">
        Team tasks
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
        Everything on the Travelgenix side, across every client, due-date
        first.
      </p>

      <div className="mt-6">
        {snapshot ? (
          <TeamTasks tasks={snapshot.teamTasks} />
        ) : (
          <div className="rounded-card border border-border bg-surface p-8 text-center shadow-soft">
            <p className="text-[15px] font-bold text-fg">No live data yet</p>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              Connect Airtable (AIRTABLE_PAT and AIRTABLE_BASE_ID on this
              project) and the team’s work appears here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
