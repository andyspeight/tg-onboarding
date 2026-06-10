import type { Metadata } from "next";
import { MessagesThread } from "@/components/portal/MessagesThread";
import { getClientJourney } from "@/lib/onboarding/data";

export const metadata: Metadata = {
  title: "Messages · Travelgenix onboarding",
};

export default async function MessagesPage() {
  const journey = await getClientJourney();

  return (
    <div className="anim-fade-up">
      <h1 className="text-2xl font-extrabold tracking-tight text-fg">
        Messages
      </h1>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-fg-muted">
        Your direct line to the team looking after your onboarding. No ticket
        numbers, no portals within portals — just ask.
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
