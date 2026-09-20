export const site = {
  name: "Arch Consult",
  email: "archbusinessline@gmail.com",
  tagline: "Build a Brand That Means Business.",
  location: "Nigeria · Remote worldwide",
};

export const founder = {
  name: "Blessed Otamekhoraye",
  role: "Founder & Branding Consultant",
  bio: [
    "Arch Consult is founder-led. Blessed Otamekhoraye founded the consultancy to help businesses turn ideas and unclear direction into strong brands and workable strategy — combining branding, business strategy and applied AI in a way most traditional agencies don't.",
    "Arch Consult is currently in its early-stage growth phase, working directly with founders and business owners, and building toward a broader consultancy and technology platform over time.",
  ],
};

export const primaryNav = [
  { label: "Services", href: "/services" },
  { label: "AI Consultant", href: "/ai-consultant" },
  { label: "AI Tools", href: "/ai-tools" },
  { label: "Health Check", href: "/health-check" },
  { label: "Launch Wizard", href: "/launch-wizard" },
  { label: "Pricing", href: "/pricing" },
  { label: "Insights", href: "/blog" },
  { label: "About", href: "/about" },
];

export type ProcessStep = { title: string; detail: string };

export type Service = {
  slug: string;
  name: string;
  summary: string;
  whatItIs: string;
  whoItsFor: string;
  problems: string[];
  deliverables: string[];
};

export const services: Service[] = [
  {
    slug: "brand-strategy",
    name: "Brand Strategy",
    summary:
      "Define the positioning, narrative and identity system your business is built on.",
    whatItIs:
      "A structured process to define who your business is for, what it stands for, and how it should be positioned against alternatives — before any visual or marketing work starts.",
    whoItsFor:
      "Founders and leadership teams who have a business but not yet a clear, specific answer to what it stands for or why a customer should choose it.",
    problems: [
      "Messaging that changes depending on who's writing it",
      "Marketing and sales that don't reinforce the same story",
      "Difficulty explaining, in one sentence, why you're different",
    ],
    deliverables: [
      "A written positioning statement your team can repeat and act on",
      "A clear picture of your ideal customer and what matters to them",
      "A narrative that holds up in a pitch, a sales call, or a job interview",
    ],
  },
  {
    slug: "brand-identity-positioning",
    name: "Brand Identity & Positioning",
    summary:
      "Visual and verbal identity built directly from your strategy, not a template.",
    whatItIs:
      "Translating an approved strategy into a visual and verbal identity — mark, type, color, tone of voice — with guidelines your team can actually follow.",
    whoItsFor:
      "Businesses with a clear strategic direction that now need an identity to match, or an existing identity that no longer reflects where the business is going.",
    problems: [
      "A visual identity that looks generic or interchangeable with competitors",
      "Inconsistent use of logo, color and tone across channels",
      "No documented guidelines, so every new hire or vendor does it differently",
    ],
    deliverables: [
      "A distinct visual identity tied to your strategy, not a moodboard",
      "Naming support if you're launching or rebranding",
      "A brand guidelines document your team and vendors can follow",
    ],
  },
  {
    slug: "business-consulting",
    name: "Business Consulting",
    summary:
      "Structural guidance on operations, model and decision-making as you scale.",
    whatItIs:
      "An outside, structured review of how your business runs — operations, decision-making, resourcing — to find what's actually constraining growth.",
    whoItsFor:
      "Business owners hitting a ceiling — growth has stalled, operations feel chaotic, or decisions are being made without a clear framework.",
    problems: [
      "Growth that's stalled despite continued effort",
      "Operational bottlenecks nobody has had time to properly diagnose",
      "Decisions made reactively rather than against a clear framework",
    ],
    deliverables: [
      "A clear, ranked list of what's actually constraining growth",
      "A practical roadmap sequenced by impact",
      "Frameworks your team keeps using after the engagement ends",
    ],
  },
  {
    slug: "business-growth-strategy",
    name: "Business Growth Strategy",
    summary:
      "A structured plan to move from where the business is to where it needs to be.",
    whatItIs:
      "A growth plan grounded in your actual numbers and constraints — pricing, offer, channels, resourcing — rather than generic growth tactics.",
    whoItsFor:
      "Businesses with a working product or service that need a deliberate plan to scale, rather than growth that depends on founder effort alone.",
    problems: [
      "Growth that depends entirely on the founder's time and network",
      "No clear view of which levers actually move revenue",
      "Ambitious targets without a credible plan to reach them",
    ],
    deliverables: [
      "A growth plan sequenced by what to fix or invest in first",
      "Clarity on which levers — pricing, offer, channel, retention — matter most",
      "Milestones you can track progress against",
    ],
  },
  {
    slug: "digital-strategy",
    name: "Digital Strategy",
    summary:
      "A plan for how your business shows up, sells and operates digitally.",
    whatItIs:
      "A digital roadmap covering website, tools and digital customer experience, tied to business outcomes rather than technology for its own sake.",
    whoItsFor:
      "Businesses whose digital presence or tools haven't kept pace with the business, or that are planning a digital presence for the first time.",
    problems: [
      "A website or digital presence that doesn't reflect the brand or convert visitors",
      "Manual processes that a lighter digital setup could remove",
      "No clear owner or plan for the business's digital experience",
    ],
    deliverables: [
      "A digital roadmap sequenced by impact and effort",
      "Recommendations for tools and platforms suited to your stage",
      "A plan for measuring what's working after launch",
    ],
  },
  {
    slug: "ai-business-automation",
    name: "AI & Business Automation",
    summary:
      "Practical AI workflows that remove manual work from your operation.",
    whatItIs:
      "Identifying and building the specific AI-driven automations that save real time — not speculative AI projects.",
    whoItsFor:
      "Lean teams doing repetitive manual work — reporting, customer responses, content, data entry — who want AI applied where it actually pays off.",
    problems: [
      "Hours lost weekly to repetitive, low-judgment tasks",
      "Uncertainty about where AI is actually worth the investment",
      "Tools that get built but nobody on the team can maintain",
    ],
    deliverables: [
      "Automation of the two or three workflows with the biggest time cost",
      "A clear view of where AI isn't worth it yet, so you don't overinvest",
      "Documentation your team can maintain without outside help",
    ],
  },
  {
    slug: "marketing-strategy",
    name: "Marketing Strategy",
    summary:
      "Channel strategy, messaging and acquisition plans grounded in your numbers.",
    whatItIs:
      "A marketing plan that prioritizes channels based on where your actual customers are, with messaging tied directly to your positioning.",
    whoItsFor:
      "Businesses spending on marketing without a clear read on what's working, or about to spend for the first time and wanting a plan before the budget goes out.",
    problems: [
      "Marketing spend without a clear way to judge what's working",
      "Messaging disconnected from actual brand positioning",
      "Trying every channel at once instead of the two or three that matter",
    ],
    deliverables: [
      "A channel plan matched to where your customers actually are",
      "Messaging tied directly to your positioning",
      "Clear metrics to judge results within weeks, not quarters",
    ],
  },
  {
    slug: "entrepreneurial-advisory",
    name: "Entrepreneurial Advisory",
    summary:
      "Ongoing, direct advisory for founders navigating early-stage decisions.",
    whatItIs:
      "Direct, ongoing access to strategic advice for founders — a sounding board for the decisions that don't have an obvious right answer.",
    whoItsFor:
      "First-time founders or early-stage business owners who want an experienced outside perspective on decisions as they come up, not just a one-off project.",
    problems: [
      "Big decisions made alone, without an outside sounding board",
      "Uncertainty about sequencing — what to solve now versus later",
      "No consistent strategic perspective as the business evolves",
    ],
    deliverables: [
      "Regular advisory sessions tied to real, current decisions",
      "An outside perspective grounded in strategy, not just opinion",
      "Continuity — the same consultant across sessions, not a rotating team",
    ],
  },
];

// --- Pricing ---
// PLACEHOLDER PRICING: clearly marked placeholder figures for the static-site
// stage. Not final — to be confirmed and made admin-editable once the
// database stage is built (see README).
export type PricingPackage = {
  slug: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  /**
   * Real numeric amount in NGN to charge via Flutterwave. Deliberately
   * left unset for every package by default — until a real, confirmed
   * price is entered here, the Pricing page will NOT show a working "Pay
   * Now" button for that package, only the existing "Get Started" link
   * to book a consultation. This is intentional: the payment pipeline is
   * fully built and testable, but no one can be charged against the
   * placeholder prices shown until you deliberately set a real amount.
   * See README "Turning on real payments" for how to test safely first.
   */
  amountNGN?: number;
};

export const pricingPackages: PricingPackage[] = [
  {
    slug: "starter",
    name: "Starter",
    price: "Placeholder",
    cadence: "one-time",
    description: "For early-stage businesses that need clarity before they build.",
    features: [
      "Business Health Check with human review",
      "Positioning workshop (1 session)",
      "Brand naming support",
      "Summary strategy document",
    ],
  },
  {
    slug: "growth",
    name: "Growth",
    price: "Placeholder",
    cadence: "one-time",
    description: "For businesses ready to scale with a real strategy behind them.",
    features: [
      "Everything in Starter",
      "Full brand strategy & identity guidelines",
      "Marketing strategy & channel plan",
      "Follow-up advisory access",
    ],
    highlighted: true,
  },
  {
    slug: "strategic",
    name: "Strategic",
    price: "Placeholder",
    cadence: "one-time",
    description: "For businesses needing comprehensive branding and strategy.",
    features: [
      "Everything in Growth",
      "Digital strategy & experience planning",
      "Business growth strategy",
      "Extended advisory access",
    ],
  },
  {
    slug: "custom-enterprise",
    name: "Custom Enterprise",
    price: "Custom",
    cadence: "quoted",
    description: "Custom consultancy scoped to organizations with complex needs.",
    features: [
      "Multi-stakeholder strategy engagements",
      "Entrepreneurial advisory retainer",
      "Dedicated consultant and reporting cadence",
      "Custom scope and timeline",
    ],
  },
];

// --- Testimonials ---
// No real client testimonials exist yet — Arch Consult is early-stage.
// This is intentionally an empty array so the section can render an honest
// "coming soon" state. Add real testimonials here as they come in:
// { quote: "...", name: "...", role: "..." }
export const testimonials: { quote: string; name: string; role: string }[] = [];

// --- Blog ---
export type BlogPost = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  content: string[]; // paragraphs
};

export const blogCategories = [
  "Branding",
  "Business Strategy",
  "Marketing",
  "Entrepreneurship",
  "AI",
  "Growth",
  "Nigerian Business",
  "African Business",
];

export const blogPosts: BlogPost[] = [
  {
    slug: "positioning-before-branding",
    category: "Branding",
    title: "Why Positioning Has to Come Before Branding",
    excerpt:
      "A logo cannot fix a business that hasn't decided what it stands for. Positioning is the work that makes branding effective.",
    date: "2026-08-04",
    readTime: "6 min read",
    content: [
      "Most businesses come to a rebrand wanting a new logo, a new color palette, a new website. Those are real deliverables, but they are the last step in a process, not the first. Skip the step before it and you get a brand that looks different but performs the same.",
      "That earlier step is positioning: a clear, specific answer to who you're for, what you do better than the alternative, and why that difference matters to the customer you actually want. Without it, a designer is left guessing — filling the gap with generic choices that could belong to almost any company in your category.",
      "You can usually tell a business skipped positioning by looking at its website. The copy talks about being 'innovative' and 'customer-focused.' The visuals are polished but forgettable. Nothing on the page could only have been written for that specific company.",
      "Positioning work isn't glamorous. It's structured interviews, competitive analysis, and hard conversations about what you're willing to say no to. But it's the difference between a brand that's decorative and one that actually changes how customers choose you.",
      "If you're planning a rebrand, budget time for positioning before you brief a designer. It will make every subsequent decision faster, cheaper, and more likely to hold up once the new site is live.",
    ],
  },
  {
    slug: "pricing-signals-brand",
    category: "Business Strategy",
    title: "Your Pricing Is a Brand Signal, Not Just a Number",
    excerpt:
      "How you price communicates who you're for and what you believe you're worth, before a customer reads a word of copy.",
    date: "2026-07-22",
    readTime: "5 min read",
    content: [
      "Pricing is usually treated as a finance decision: cover costs, add margin, check what competitors charge. That's necessary, but it misses something. Before a customer reads a single word of your marketing, your price has already told them who you think you're for.",
      "A price that's meaningfully lower than the category signals accessibility — but it can also signal lower quality, whether or not that's true. A price at or above the category signals confidence, but only if everything else about the brand backs it up.",
      "The mismatch to watch for is a premium-positioned brand with discount-level pricing, or the reverse. Customers notice the inconsistency even if they can't name it. It shows up as hesitation at checkout, or as the wrong customers showing up in the first place.",
      "Before your next pricing review, ask whether the number matches the position you're trying to hold in the market — not just whether it covers your margin.",
    ],
  },
  {
    slug: "ai-automation-for-lean-teams",
    category: "AI",
    title: "Where AI Automation Actually Pays Off for Lean Teams",
    excerpt:
      "Not every workflow deserves automation. Here's how to find the two or three that matter for a small operation.",
    date: "2026-07-09",
    readTime: "7 min read",
    content: [
      "Small teams hear a lot about AI automation and end up trying to automate everything at once — customer support, reporting, content, scheduling — and end up with a pile of half-finished tools instead of real time saved.",
      "A better approach: list every repetitive task your team does in a normal week, then rank each one by two things — how much time it costs, and how repetitive and structured it is. The highest-value automation targets sit at the intersection: high time cost, low judgment required.",
      "For most lean teams, that shortlist is small — usually two or three workflows. Common candidates: first-draft customer responses, recurring reporting, and repetitive data entry between tools that don't talk to each other.",
      "Everything else — anything requiring real judgment, relationship management, or creative decision-making — is usually not worth automating yet, even if it's technically possible.",
      "Start with the two or three workflows on your shortlist, measure the actual time saved after a month, and only then decide whether to expand further.",
    ],
  },
  {
    slug: "brand-guidelines-that-get-used",
    category: "Branding",
    title: "Brand Guidelines Nobody Actually Follows (and How to Fix Them)",
    excerpt:
      "A 60-page brand guideline document that sits unopened isn't a brand system — it's a filing cabinet. Here's what makes guidelines usable.",
    date: "2026-06-18",
    readTime: "5 min read",
    content: [
      "Most brand guideline documents are written to look impressive in a pitch, not to be used on a Tuesday afternoon by someone building a slide deck. That's why so many of them end up ignored within a few months of a rebrand.",
      "Usable guidelines are short, specific, and answer the questions people actually ask: which logo file do I use here, what's the exact hex code, can text go on this background, what's off-limits. If your guidelines don't answer those in under a minute, they'll get abandoned.",
      "The fix isn't more pages — it's fewer, clearer ones, built around real use cases: a slide deck, a social post, a signature, a vendor asset. Show the right way and the wrong way side by side wherever possible.",
    ],
  },
  {
    slug: "founder-led-sales-limits",
    category: "Entrepreneurship",
    title: "The Point Where Founder-Led Sales Stops Working",
    excerpt:
      "Founder relationships can carry a business a long way — until they can't. Here's how to know when it's time to build a real pipeline.",
    date: "2026-05-30",
    readTime: "6 min read",
    content: [
      "In the early stage, founder-led sales is usually the right approach — founders close deals faster than anyone else can, because they know the product and the market better than any hire could in month one.",
      "The problem shows up later: growth plateaus at exactly the ceiling of the founder's personal time and network. Referrals slow down. The pipeline gets unpredictable. And there's no documented process for anyone else to follow.",
      "The signal to watch for isn't revenue — it's whether you can describe your sales process as a repeatable sequence of steps, or whether it lives entirely in the founder's head. If it's the latter, that's the moment to invest in pipeline structure, before growth stalls on its own.",
    ],
  },
  {
    slug: "digital-presence-african-smes",
    category: "African Business",
    title: "What Digital Presence Actually Means for African SMEs Right Now",
    excerpt:
      "An Instagram page and a WhatsApp number aren't a digital strategy. Here's a more useful baseline for small and mid-sized businesses.",
    date: "2026-05-11",
    readTime: "6 min read",
    content: [
      "For a lot of African SMEs, digital presence still means a business Instagram page and a WhatsApp Business number, run informally alongside everything else. That's a reasonable starting point, but it usually stalls growth once a business needs to look credible to larger customers, partners, or investors.",
      "A more durable baseline includes a real website that works well on mobile data, a clear way to take payment or bookings without a back-and-forth DM conversation, and consistent business information across every platform a customer might find you on.",
      "None of this requires a large budget. It requires deciding that digital presence is infrastructure, not decoration — and building it once, properly, instead of patching it platform by platform as problems come up.",
    ],
  },
];

export const insightsPreview = blogPosts.slice(0, 3).map((post) => ({
  slug: post.slug,
  category: post.category,
  title: post.title,
  excerpt: post.excerpt,
}));

// --- Booking ---
export const consultationTypes = [
  "General Strategy Consultation",
  "Brand Strategy & Identity",
  "Business Growth Strategy",
  "Digital Strategy",
  "AI & Business Automation",
  "Marketing Strategy",
  "Entrepreneurial Advisory",
  "Not sure yet — help me figure it out",
];

// Fixed slots for now, since there's no live calendar/availability system
// yet. Structured so a real calendar integration can slot in later without
// changing the booking form or database shape.
export const bookingTimeSlots = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];
