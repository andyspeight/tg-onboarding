import type { IntakeSection, OnboardingJourney } from "./types";
import { shiftDays, ukToday } from "./dates";

/**
 * Central supplier lists. These feed the multi-selects in the Suppliers
 * section. After the Airtable swap they live in a Suppliers table the team
 * curates directly in Airtable; the admin UI for managing them is Phase 2.
 */
const PACKAGE_SUPPLIERS = [
  "Jet2holidays",
  "TUI",
  "easyJet holidays",
  "Hays Faraway",
  "Gold Medal",
  "Olympic Holidays",
  "Classic Collection",
  "If Only",
  "Cyplon Holidays",
  "Funway Holidays",
];

const ACCOMMODATION_SUPPLIERS = [
  "Booking.com",
  "Expedia TAAP",
  "Bedsonline",
  "Hotelbeds",
  "Stuba",
  "RoomRes",
  "Sunhotels",
  "WebBeds",
];

const FLIGHT_SUPPLIERS = [
  "Travelport",
  "Amadeus",
  "Sabre",
  "Aviate",
  "Lime Management",
  "Travel 2",
];

/**
 * The smart intake form, adapted from the approved prototype. The Suppliers
 * section is tier-conditional: Spark clients don't manage their own supplier
 * feeds, so they never see it (filtering happens in `data.ts`). When Airtable
 * is connected, the supplier multi-select options are replaced by the live
 * Suppliers table; these lists are the offline fallback.
 */
export const INTAKE_SECTIONS: IntakeSection[] = [
  {
    id: "business",
    title: "Business details",
    description: "The basics about your travel business.",
    fields: [
      {
        id: "trading-name",
        label: "Trading name",
        type: "text",
        placeholder: "e.g. Wanderlust Travel",
        required: true,
      },
      {
        id: "legal-name",
        label: "Legal company name (if different)",
        type: "text",
        placeholder: "e.g. Wanderlust Travel Ltd",
      },
      {
        id: "atol",
        label: "ATOL number (if applicable)",
        type: "text",
        placeholder: "e.g. 12345",
      },
      {
        id: "abta",
        label: "ABTA number (if applicable)",
        type: "text",
        placeholder: "e.g. Y1234",
      },
      {
        id: "business-type",
        label: "What type of business are you?",
        type: "select",
        options: [
          "High street travel agent",
          "Homeworking travel agent",
          "Online travel agent",
          "Tour operator",
          "Travel consortium",
          "OTA",
          "Other",
        ],
        required: true,
      },
      {
        id: "consortium",
        label: "Consortium name (if you're part of one)",
        type: "text",
        placeholder: "e.g. The Travel Network Group, Advantage, Hays IG...",
      },
    ],
  },
  {
    id: "branding",
    title: "Branding & design",
    description: "Help us match your site to your brand.",
    fields: [
      {
        id: "brand-logos",
        label: "Upload your logo(s)",
        type: "upload",
        helper:
          "PNG or SVG works well. Vector files (AI or EPS) are even better if you have them.",
      },
      {
        id: "brand-colour-primary",
        label: "Your primary brand colour",
        type: "text",
        placeholder: "e.g. #2E75B6 or 'navy blue'",
      },
      {
        id: "brand-colour-secondary",
        label: "Your secondary brand colour",
        type: "text",
        placeholder: "e.g. #FF6B35 or 'coral'",
      },
      {
        id: "brand-inspiration",
        label: "Any websites you love the look of?",
        type: "textarea",
        placeholder: "Share links to sites whose style you like...",
      },
      {
        id: "brand-guidelines",
        label: "Do you have existing brand guidelines?",
        type: "select",
        options: [
          "Yes, I'll upload them in Documents",
          "No, please suggest something",
          "Sort of, we have a logo and colours but nothing formal",
        ],
      },
    ],
  },
  {
    id: "suppliers",
    title: "Suppliers & integrations",
    description: "Which suppliers do you work with?",
    showForPlans: ["Boost", "Ignite"],
    fields: [
      {
        id: "suppliers-package",
        label: "Package holiday suppliers",
        type: "multiselect",
        placeholder: "Select suppliers...",
        options: PACKAGE_SUPPLIERS,
      },
      {
        id: "suppliers-accommodation",
        label: "Accommodation suppliers",
        type: "multiselect",
        placeholder: "Select suppliers...",
        options: ACCOMMODATION_SUPPLIERS,
      },
      {
        id: "suppliers-flights",
        label: "Flight-only suppliers",
        type: "multiselect",
        placeholder: "Select suppliers...",
        options: FLIGHT_SUPPLIERS,
      },
      {
        id: "suppliers-other",
        label: "Anyone we've missed?",
        type: "textarea",
        placeholder: "List any other suppliers you work with...",
      },
      {
        id: "suppliers-cruise",
        label: "Do you need cruise content?",
        type: "select",
        options: ["Yes", "No", "Maybe later"],
      },
    ],
  },
  {
    id: "content",
    title: "Content & pages",
    description: "What should your website include?",
    fields: [
      {
        id: "content-destinations",
        label: "What destinations do you specialise in?",
        type: "textarea",
        placeholder: "e.g. Mediterranean, Caribbean, ski...",
      },
      {
        id: "content-blog",
        label: "Do you want a blog on your site?",
        type: "select",
        options: ["Yes", "No", "Not sure yet"],
      },
      {
        id: "content-pages",
        label: "Any specific pages you need?",
        type: "textarea",
        placeholder: "e.g. Group travel, weddings abroad...",
      },
    ],
  },
  {
    id: "domain",
    title: "Domain & technical",
    description: "Getting your web address sorted.",
    fields: [
      {
        id: "domain-name",
        label: "Your domain name",
        type: "text",
        placeholder: "e.g. wanderlusttravel.co.uk",
        required: true,
      },
      {
        id: "domain-owned",
        label: "Do you already own this domain?",
        type: "select",
        options: ["Yes, I own it", "No, I need to buy it", "Not sure"],
        required: true,
      },
      {
        id: "domain-registrar",
        label: "Where is it registered?",
        type: "text",
        placeholder: "e.g. GoDaddy, 123-reg, Namecheap...",
      },
      {
        id: "domain-email",
        label: "Do you have email on this domain already?",
        type: "select",
        options: ["Yes", "No"],
      },
    ],
  },
];

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
    source: "mock",
    asOf,
    intakeResponses: {},
    trainingCompleted: [],
    confidence: null,
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
    intake: INTAKE_SECTIONS,
    documents: [
      {
        id: "d1",
        name: "Service agreement (Boost package)",
        category: "Contracts",
        fileType: "PDF",
        addedAt: day(-18),
        status: "signed",
      },
      {
        id: "d2",
        name: "Welcome pack",
        category: "Getting started",
        fileType: "PDF",
        addedAt: day(-18),
        status: "available",
      },
      {
        id: "d3",
        name: "Brand guidelines template",
        category: "Getting started",
        fileType: "DOCX",
        addedAt: day(-18),
        status: "available",
      },
      {
        id: "d4",
        name: "Supplier setup guide: tour operators",
        category: "Supplier guides",
        fileType: "PDF",
        addedAt: day(-18),
        status: "available",
      },
      {
        id: "d5",
        name: "Supplier setup guide: accommodation",
        category: "Supplier guides",
        fileType: "PDF",
        addedAt: day(-18),
        status: "available",
      },
      {
        id: "d6",
        name: "Domain and DNS setup instructions",
        category: "Technical",
        fileType: "PDF",
        addedAt: day(-6),
        status: "available",
      },
      {
        id: "d7",
        name: "Travelgenix University quick start guide",
        category: "Training",
        fileType: "PDF",
        addedAt: day(-18),
        status: "available",
      },
      {
        id: "d8",
        name: "Homepage design (v1 draft)",
        category: "Your site",
        fileType: "PNG",
        addedAt: day(3),
        status: "pending",
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
