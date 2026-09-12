export const site = {
  name: "Arch Consult",
  email: "archbusinessline@gmail.com",
  tagline: "Build a Brand That Means Business.",
};

export const primaryNav = [
  { label: "Services", href: "/services" },
  { label: "AI Consultant", href: "/ai-consultant" },
  { label: "Health Check", href: "/health-check" },
  { label: "Launch Wizard", href: "/launch-wizard" },
  { label: "Pricing", href: "/pricing" },
  { label: "Insights", href: "/blog" },
  { label: "About", href: "/about" },
];

export type Service = {
  slug: string;
  name: string;
  summary: string;
};

export const services: Service[] = [
  {
    slug: "brand-strategy",
    name: "Brand Strategy",
    summary:
      "Define the positioning, narrative and identity system your business is built on.",
  },
  {
    slug: "brand-identity",
    name: "Brand Identity",
    summary:
      "Visual identity, naming and brand guidelines that hold up across every touchpoint.",
  },
  {
    slug: "business-consulting",
    name: "Business Consulting",
    summary:
      "Structural guidance on operations, model and decision-making as you scale.",
  },
  {
    slug: "marketing-strategy",
    name: "Marketing Strategy",
    summary:
      "Channel strategy, messaging and acquisition plans grounded in your numbers.",
  },
  {
    slug: "digital-transformation",
    name: "Digital Transformation",
    summary:
      "Modernise how your business runs, sells and serves customers digitally.",
  },
  {
    slug: "ai-business-automation",
    name: "AI Business Automation",
    summary:
      "Practical AI workflows that remove manual work from your operation.",
  },
  {
    slug: "website-digital-experience",
    name: "Website & Digital Experience",
    summary:
      "Digital experiences engineered to convert, not just to look presentable.",
  },
  {
    slug: "business-development",
    name: "Business Development",
    summary:
      "Partnership, sales and growth pipelines built for sustainable expansion.",
  },
  {
    slug: "corporate-training",
    name: "Corporate Training",
    summary:
      "Upskill your team in strategy, brand and digital execution.",
  },
  {
    slug: "startup-launch-consulting",
    name: "Startup / Business Launch Consulting",
    summary:
      "Structured guidance from idea to a business ready to trade.",
  },
];

export const testimonials = [
  {
    quote:
      "Arch Consult rebuilt our positioning from the ground up. Within two quarters our close rate on enterprise deals nearly doubled.",
    name: "Amara Chukwu",
    role: "Founder, Northbridge Logistics",
  },
  {
    quote:
      "The Business Health Check surfaced problems we hadn't named yet. The roadmap that followed was the clearest strategy document we've had.",
    name: "Daniel Osei",
    role: "CEO, Loom & Line Retail",
  },
  {
    quote:
      "We used the Launch Wizard before writing a single line of code. It shaped the product, the pricing, and the first hires.",
    name: "Priya Nair",
    role: "Co-founder, Fieldstack",
  },
];

export const caseStudies = [
  {
    client: "Northbridge Logistics",
    industry: "B2B Logistics",
    result: "Repositioned and rebranded ahead of a Series A raise.",
  },
  {
    client: "Loom & Line Retail",
    industry: "Retail",
    result: "Full brand and marketing overhaul lifting repeat purchase rate 34%.",
  },
  {
    client: "Fieldstack",
    industry: "SaaS / Startup",
    result: "Zero-to-one launch strategy and go-to-market plan.",
  },
];

export const insightsPreview = [
  {
    slug: "positioning-before-branding",
    category: "Branding",
    title: "Why Positioning Has to Come Before Branding",
    excerpt:
      "A logo cannot fix a business that hasn't decided what it stands for. Positioning is the work that makes branding effective.",
  },
  {
    slug: "pricing-signals-brand",
    category: "Business Strategy",
    title: "Your Pricing Is a Brand Signal, Not Just a Number",
    excerpt:
      "How you price communicates who you're for and what you believe you're worth, before a customer reads a word of copy.",
  },
  {
    slug: "ai-automation-for-lean-teams",
    category: "AI",
    title: "Where AI Automation Actually Pays Off for Lean Teams",
    excerpt:
      "Not every workflow deserves automation. Here's how to find the three that matter for a small operation.",
  },
];
