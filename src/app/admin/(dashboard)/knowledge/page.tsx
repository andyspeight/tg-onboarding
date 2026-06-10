import type { Metadata } from "next";
import { KnowledgeAdmin } from "@/components/admin/KnowledgeAdmin";
import { fetchAdminKnowledge } from "@/lib/onboarding/airtable";

export const metadata: Metadata = {
  title: "Knowledge base · Travelgenix onboarding",
  robots: { index: false, follow: false },
};

export default async function KnowledgePage() {
  const articles = await fetchAdminKnowledge();

  return (
    <div className="anim-fade-up">
      <h1 className="text-2xl font-extrabold tracking-tight text-fg">
        Knowledge base
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fg-muted">
        Everything Luna is allowed to answer in client messages. Each article
        is a question, the words that trigger it, and the answer exactly as a
        client should read it. Anything not covered here goes to a human
        untouched.
      </p>

      <div className="mt-6">
        {articles ? (
          <KnowledgeAdmin initial={articles} />
        ) : (
          <div className="rounded-card border border-border bg-surface p-8 text-center shadow-soft">
            <p className="text-[15px] font-bold text-fg">No live data yet</p>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              Connect Airtable on this project and the knowledge base appears
              here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
