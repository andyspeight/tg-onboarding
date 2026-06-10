import { Overview } from "@/components/admin/Overview";
import { fetchAdminSnapshot } from "@/lib/onboarding/airtable";

export default async function AdminOverviewPage() {
  const snapshot = await fetchAdminSnapshot();

  return (
    <div className="anim-fade-up">
      <h1 className="text-2xl font-extrabold tracking-tight text-fg">
        Good to see you
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
        Your onboarding overview: who’s moving, who’s slowing, and what needs
        a nudge.
      </p>

      <div className="mt-6">
        {snapshot ? (
          <Overview clients={snapshot.clients} />
        ) : (
          <div className="rounded-card border border-border bg-surface p-8 text-center shadow-soft">
            <p className="text-[15px] font-bold text-fg">No live data yet</p>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              Connect Airtable (AIRTABLE_PAT and AIRTABLE_BASE_ID on this
              project) and your clients appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
