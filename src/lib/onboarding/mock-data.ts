import type { OnboardingJourney } from "./types";

/**
 * Seed journey for Phase 1. This stands in for whatever Airtable will return.
 * It deliberately includes a few `audience: "internal"` tasks so we can prove
 * the client view hides them (they belong to Phase 2's staff dashboard).
 *
 * Statuses are set mid-journey (phases 1–2 done, 3 in progress) so the portal
 * shows real progress rather than an empty start state.
 */
export const mockJourney: OnboardingJourney = {
  client: {
    company: "Blue Horizon Travel",
    contactName: "Sam",
    plan: "Travelgenix Pro",
    onboardingStartedAt: "2026-05-26",
    specialistName: "Priya",
  },
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
          id: "p1-meet",
          title: "Meet your onboarding specialist",
          description: "A quick intro to Priya, who'll be alongside you the whole way.",
          audience: "client",
          done: true,
        },
        {
          id: "p1-questionnaire",
          title: "Complete your welcome questionnaire",
          description: "Tells us about your brand, your customers and your goals.",
          audience: "client",
          done: true,
        },
        {
          id: "p1-kickoff",
          title: "Book your kickoff call",
          audience: "client",
          done: true,
        },
        {
          id: "p1-provision",
          title: "Provision client workspace",
          audience: "internal",
          done: true,
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
          title: "Upload your logo and brand colours",
          audience: "client",
          done: true,
        },
        {
          id: "p2-content",
          title: "Share your destination and product content",
          description: "Photos, descriptions, anything that makes your trips sing.",
          audience: "client",
          done: true,
        },
        {
          id: "p2-domain",
          title: "Confirm your domain name",
          audience: "client",
          done: true,
        },
        {
          id: "p2-qa",
          title: "QA brand assets against guidelines",
          audience: "internal",
          done: true,
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
        "We turn your content into a polished, bookable site — and you tell us what to tweak.",
      status: "active",
      estimateLabel: "1–2 weeks",
      tasks: [
        {
          id: "p3-homepage",
          title: "Review your homepage draft",
          description: "First look at your new front door. Tell us what you think.",
          audience: "client",
          done: true,
        },
        {
          id: "p3-layouts",
          title: "Approve your page layouts",
          audience: "client",
          done: false,
        },
        {
          id: "p3-booking",
          title: "Sign off on your booking flow",
          description: "Walk through a test booking from a customer's point of view.",
          audience: "client",
          done: false,
        },
        {
          id: "p3-staging",
          title: "Build staging site & run internal design review",
          audience: "internal",
          done: false,
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
          title: "Complete the platform basics course",
          audience: "client",
          done: false,
        },
        {
          id: "p4-practice",
          title: "Practise creating a booking in the sandbox",
          audience: "client",
          done: false,
        },
        {
          id: "p4-team",
          title: "Set up logins for your team",
          audience: "client",
          done: false,
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
          done: false,
        },
        {
          id: "p5-payments",
          title: "Confirm your payment gateway details",
          audience: "client",
          done: false,
        },
        {
          id: "p5-date",
          title: "Set your go-live date",
          audience: "client",
          done: false,
        },
        {
          id: "p5-prelaunch",
          title: "Run pre-launch technical checks",
          audience: "internal",
          done: false,
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
        prompt: "Before we go live, how confident do you feel running things yourself?",
        helpText:
          "There's no wrong answer. If you're not at a 7 yet, we'll spend more time together until you are — going live should feel exciting, not daunting.",
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
          done: false,
        },
        {
          id: "p6-analytics",
          title: "Review your first week's analytics",
          audience: "client",
          done: false,
        },
        {
          id: "p6-checkin",
          title: "Check in with Priya",
          audience: "client",
          done: false,
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
        "Standing on your own and growing — with the tools and community to keep going.",
      status: "upcoming",
      estimateLabel: "Ongoing",
      tasks: [
        {
          id: "p7-marketing",
          title: "Explore the advanced marketing tools",
          audience: "client",
          done: false,
        },
        {
          id: "p7-community",
          title: "Join the Travelgenix community",
          audience: "client",
          done: false,
        },
        {
          id: "p7-review",
          title: "Book a growth review",
          audience: "client",
          done: false,
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
