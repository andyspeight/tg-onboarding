import type { OnboardingJourney } from "./types";
import { shiftDays, ukToday } from "./dates";

/**
 * Seed journey for Phase 1. This stands in for whatever Airtable will return.
 *
 * The client is the spec's fictitious test client (Sarah Mitchell at
 * Wanderlust Travel, Boost package — see docs/phase-1-spec.md). Due dates are
 * generated relative to today so the demo always reads mid-journey, and a few
 * `audience: "internal"` tasks prove the client view hides them (they belong
 * to Phase 2's staff dashboard).
 *
 * Statuses are set mid-journey (phases 1–2 done, 3 in progress) so the portal
 * shows real progress rather than an empty start state.
 */
export function makeMockJourney(): OnboardingJourney {
  const asOf = ukToday();
  const day = (offset: number) => shiftDays(asOf, offset);

  return {
    asOf,
    client: {
      company: "Wanderlust Travel",
      contactName: "Sarah Mitchell",
      plan: "Boost",
      onboardingStartedAt: day(-18),
      accountManager: "Andy Speight",
    },
    notifications: [
      {
        id: "n1",
        kind: "progress",
        text: "Andy has started building your homepage",
        whenLabel: "1h ago",
        read: false,
      },
      {
        id: "n2",
        kind: "reminder",
        text: "Your About Us content is due in 4 days",
        whenLabel: "2h ago",
        read: false,
      },
      {
        id: "n3",
        kind: "complete",
        text: "You completed: confirm your domain name",
        whenLabel: "3d ago",
        read: true,
      },
      {
        id: "n4",
        kind: "welcome",
        text: "Welcome to Travelgenix. Your portal is ready.",
        whenLabel: "18d ago",
        read: true,
      },
    ],
    phases: [
      {
        id: "phase-1",
        number: 1,
        slug: "welcome-kickoff",
        title: "Welcome & Kickoff",
        summary:
          "Say hello, meet the person looking after you, and tell us a little about how you work.",
        status: "completed",
        estimateLabel: "Day one",
        tasks: [
          {
            id: "p1-call",
            title: "Welcome call with Andy",
            description: "A quick hello and a walk through what happens next.",
            audience: "client",
            owner: "both",
            status: "done",
            dueDate: day(-17),
          },
          {
            id: "p1-details",
            title: "Complete your business details form",
            description: "Tells us about your brand, your customers and your goals.",
            audience: "client",
            owner: "client",
            status: "done",
            dueDate: day(-14),
          },
          {
            id: "p1-kickoff",
            title: "Book your kickoff call",
            audience: "client",
            owner: "client",
            status: "done",
            dueDate: day(-13),
          },
          {
            id: "p1-provision",
            title: "Provision client workspace",
            audience: "internal",
            owner: "travelgenix",
            status: "done",
          },
        ],
        training: [
          {
            id: "p1-vid",
            type: "video",
            title: "Welcome to Travelgenix",
            description: "A two-minute hello and a look at what's ahead.",
            durationLabel: "2 min watch",
          },
          {
            id: "p1-art",
            type: "article",
            title: "How your onboarding works",
            durationLabel: "3 min read",
          },
        ],
      },
      {
        id: "phase-2",
        number: 2,
        slug: "content-branding",
        title: "Content & Branding Collection",
        summary:
          "Send us your look and your words so your new site feels unmistakably you.",
        status: "completed",
        estimateLabel: "About a week",
        tasks: [
          {
            id: "p2-logo",
            title: "Upload your logo and brand assets",
            audience: "client",
            owner: "client",
            status: "done",
            dueDate: day(-10),
          },
          {
            id: "p2-content",
            title: "Share your destination and product content",
            description: "Photos, descriptions, anything that makes your trips sing.",
            audience: "client",
            owner: "client",
            status: "done",
            dueDate: day(-8),
          },
          {
            id: "p2-domain",
            title: "Confirm your domain name",
            audience: "client",
            owner: "client",
            status: "done",
            dueDate: day(-3),
          },
          {
            id: "p2-qa",
            title: "QA brand assets against guidelines",
            audience: "internal",
            owner: "travelgenix",
            status: "done",
          },
        ],
        training: [
          {
            id: "p2-art",
            type: "article",
            title: "Getting your content ready",
            description: "What to send, and the formats that work best.",
            durationLabel: "4 min read",
          },
          {
            id: "p2-vid",
            type: "video",
            title: "Brand setup walkthrough",
            durationLabel: "5 min watch",
          },
        ],
      },
      {
        id: "phase-3",
        number: 3,
        slug: "website-build",
        title: "Website Build",
        summary:
          "We turn your content into a polished, bookable site, and you tell us what to tweak.",
        status: "active",
        estimateLabel: "1–2 weeks",
        tasks: [
          {
            id: "p3-homepage",
            title: "Build your homepage draft",
            description: "We're on this now. You'll get a preview link the moment it's ready.",
            audience: "client",
            owner: "travelgenix",
            status: "in-progress",
            dueDate: day(3),
          },
          {
            id: "p3-about",
            title: "Send us your About Us content",
            description: "Your story, in your words. A few paragraphs is plenty.",
            audience: "client",
            owner: "client",
            status: "in-progress",
            dueDate: day(4),
          },
          {
            id: "p3-widgets",
            title: "Configure your search widgets",
            audience: "client",
            owner: "travelgenix",
            status: "todo",
            dueDate: day(5),
          },
          {
            id: "p3-suppliers",
            title: "Send us your supplier account details",
            description: "So we can connect your booking feeds. We'll never share them.",
            audience: "client",
            owner: "client",
            status: "todo",
            dueDate: day(6),
          },
          {
            id: "p3-review",
            title: "Review and approve your homepage",
            description: "First look at your new front door. Tell us what you think.",
            audience: "client",
            owner: "client",
            status: "todo",
            dueDate: day(8),
          },
          {
            id: "p3-staging",
            title: "Build staging site & run internal design review",
            audience: "internal",
            owner: "travelgenix",
            status: "todo",
          },
        ],
        training: [
          {
            id: "p3-vid",
            type: "video",
            title: "A tour of your new site",
            description: "Where everything lives and how to find your way around.",
            durationLabel: "5 min watch",
          },
        ],
      },
      {
        id: "phase-4",
        number: 4,
        slug: "training-familiarisation",
        title: "Training & Familiarisation",
        summary:
          "Get hands-on in a safe sandbox so the platform feels second nature before launch.",
        status: "upcoming",
        estimateLabel: "About a week",
        tasks: [
          {
            id: "p4-basics",
            title: "Complete the Travelgenix University core modules",
            audience: "client",
            owner: "client",
            status: "todo",
            dueDate: day(14),
          },
          {
            id: "p4-practice",
            title: "Practise creating a booking in the sandbox",
            audience: "client",
            owner: "client",
            status: "todo",
            dueDate: day(16),
          },
          {
            id: "p4-session",
            title: "1-to-1 training session",
            description: "A live session with Andy, shaped around how you'll actually work.",
            audience: "client",
            owner: "both",
            status: "todo",
            dueDate: day(17),
          },
          {
            id: "p4-team",
            title: "Set up logins for your team",
            audience: "client",
            owner: "client",
            status: "todo",
            dueDate: day(18),
            optional: true,
          },
        ],
        training: [
          {
            id: "p4-vid1",
            type: "video",
            title: "Platform basics: the essentials",
            durationLabel: "8 min watch",
          },
          {
            id: "p4-vid2",
            type: "video",
            title: "Taking your first booking",
            durationLabel: "6 min watch",
          },
        ],
      },
      {
        id: "phase-5",
        number: 5,
        slug: "go-live-prep",
        title: "Go-Live Prep",
        summary:
          "The final checks before we flip the switch and your site goes out into the world.",
        status: "upcoming",
        estimateLabel: "A few days",
        tasks: [
          {
            id: "p5-content",
            title: "Final content review",
            audience: "client",
            owner: "client",
            status: "todo",
            dueDate: day(21),
          },
          {
            id: "p5-payments",
            title: "Confirm your payment gateway details",
            audience: "client",
            owner: "client",
            status: "todo",
            dueDate: day(22),
          },
          {
            id: "p5-test",
            title: "Test your booking flow end-to-end",
            description: "Walk through a test booking from a customer's point of view.",
            audience: "client",
            owner: "both",
            status: "todo",
            dueDate: day(23),
          },
          {
            id: "p5-date",
            title: "Set your go-live date",
            audience: "client",
            owner: "client",
            status: "todo",
            dueDate: day(24),
          },
          {
            id: "p5-prelaunch",
            title: "Run pre-launch technical checks",
            audience: "internal",
            owner: "travelgenix",
            status: "todo",
          },
        ],
        training: [
          {
            id: "p5-art",
            type: "article",
            title: "Your go-live checklist",
            durationLabel: "3 min read",
          },
        ],
        gate: {
          minRating: 7,
          prompt:
            "Before we go live, how confident do you feel running things yourself?",
          helpText:
            "There's no wrong answer. If you're not at a 7 yet, we'll spend more time together until you are. Going live should feel exciting, not daunting.",
        },
      },
      {
        id: "phase-6",
        number: 6,
        slug: "first-30-days",
        title: "First 30 Days Live",
        summary:
          "You're live. Now we help you find your rhythm and read what your customers are doing.",
        status: "upcoming",
        estimateLabel: "First month",
        tasks: [
          {
            id: "p6-promo",
            title: "Publish your first promotion",
            audience: "client",
            owner: "client",
            status: "todo",
            dueDate: day(32),
          },
          {
            id: "p6-analytics",
            title: "Review your first week's bookings and enquiries",
            audience: "client",
            owner: "client",
            status: "todo",
            dueDate: day(35),
          },
          {
            id: "p6-checkin",
            title: "30-day check-in call",
            audience: "client",
            owner: "both",
            status: "todo",
            dueDate: day(48),
          },
          {
            id: "p6-signals",
            title: "Monitor engagement signals",
            audience: "internal",
            owner: "travelgenix",
            status: "todo",
          },
        ],
        training: [
          {
            id: "p6-vid",
            type: "video",
            title: "Making sense of your dashboard",
            durationLabel: "6 min watch",
          },
        ],
      },
      {
        id: "phase-7",
        number: 7,
        slug: "growth-independence",
        title: "Growth & Independence",
        summary:
          "Standing on your own and growing, with the tools and community to keep going.",
        status: "upcoming",
        estimateLabel: "Ongoing",
        tasks: [
          {
            id: "p7-marketing",
            title: "Explore the advanced marketing tools",
            audience: "client",
            owner: "client",
            status: "todo",
            dueDate: day(55),
          },
          {
            id: "p7-community",
            title: "Join the Travelgenix community",
            audience: "client",
            owner: "client",
            status: "todo",
            dueDate: day(58),
          },
          {
            id: "p7-review",
            title: "Book a growth review",
            audience: "client",
            owner: "both",
            status: "todo",
            dueDate: day(60),
            optional: true,
          },
        ],
        training: [
          {
            id: "p7-art",
            type: "article",
            title: "Growing with Travelgenix",
            durationLabel: "5 min read",
          },
        ],
      },
    ],
  };
}
