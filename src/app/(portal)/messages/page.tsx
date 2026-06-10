import type { Metadata } from "next";
import { MessagesThread } from "@/components/portal/MessagesThread";
import { SparkleIcon } from "@/components/icons";
import { getClientJourney } from "@/lib/onboarding/data";

export const metadata: Metadata = {
  title: "Messages · Travelgenix onboarding",
};

export default async function MessagesPage() {
  const journey = await getClientJourney();

  return (
    <div className="anim-fade-up">
      <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-fg">
        Messages
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent">
          <SparkleIcon className="h-3 w-3" /> Luna powered
        </span>
      </h1>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-fg-muted">
        Your direct line to the team looking after your onboarding. Luna, our
        helper, answers the common questions on the spot; a human picks up
        everything else. Attach screenshots or files whenever they help.
      </p>

      <div className="mt-6">
        <MessagesThread
          messages={journey.messages}
          unread={journey.unreadMessages}
          live={journey.source === "airtable"}
          accountManager={journey.client.accountManager}
        />
      </div>
    </div>
  );
}
