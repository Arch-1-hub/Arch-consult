export type ToolField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: string[];
  required?: boolean;
};

export type AITool = {
  slug: string;
  name: string;
  description: string;
  fields: ToolField[];
  /** One or two sentences telling the model what this tool's job is. */
  promptFocus: string;
  /** Section headings the output must use, in order. */
  expectedSections: string[];
};

export const aiTools: AITool[] = [
  {
    slug: "brand-name-generator",
    name: "Brand Name Generator",
    description: "Get brand name ideas grounded in what your business actually does.",
    fields: [
      { key: "description", label: "Describe your business", type: "textarea", required: true, placeholder: "What does the business do, and for whom?" },
      { key: "industry", label: "Industry", type: "text", required: true, placeholder: "e.g. skincare, logistics, SaaS" },
      { key: "style", label: "Naming style you're drawn to (optional)", type: "text", placeholder: "e.g. modern and minimal, warm and local, bold and direct" },
    ],
    promptFocus: "Generate brand name ideas. Every name must be plausible for the specific business described, not generic filler names.",
    expectedSections: ["Name Ideas", "Naming Direction"],
  },
  {
    slug: "brand-strategy-generator",
    name: "Brand Strategy Generator",
    description: "A positioning and narrative starting point for your brand.",
    fields: [
      { key: "description", label: "Describe your business", type: "textarea", required: true },
      { key: "audience", label: "Target audience", type: "textarea", required: true },
      { key: "goals", label: "What are your brand goals?", type: "textarea", required: true },
    ],
    promptFocus: "Produce a starting-point brand strategy grounded in the specifics given, not generic branding advice.",
    expectedSections: ["Positioning Statement", "Key Differentiators", "Brand Tone & Voice"],
  },
  {
    slug: "logo-brief-generator",
    name: "Logo Brief Generator",
    description: "A creative brief a designer could actually work from.",
    fields: [
      { key: "businessName", label: "Business name", type: "text", required: true },
      { key: "industry", label: "Industry", type: "text", required: true },
      { key: "personality", label: "Brand personality / style preferences", type: "textarea", required: true, placeholder: "e.g. premium and minimal, playful and colorful" },
      { key: "colors", label: "Color preferences (optional)", type: "text" },
    ],
    promptFocus: "Produce a logo design brief a designer could work from directly. Be specific to this business, not generic logo advice.",
    expectedSections: ["Design Direction", "Visual Motifs to Explore", "Typography Direction", "Color Direction"],
  },
  {
    slug: "marketing-plan-generator",
    name: "Marketing Plan Generator",
    description: "A channel-prioritized marketing plan for your stage and budget.",
    fields: [
      { key: "description", label: "Describe your business", type: "textarea", required: true },
      { key: "audience", label: "Target audience", type: "textarea", required: true },
      { key: "budget", label: "Budget / stage", type: "select", options: ["Bootstrapped / minimal budget", "Small budget available", "Moderate budget", "Well-funded"], required: true },
      { key: "goals", label: "Marketing goals", type: "textarea", required: true },
    ],
    promptFocus: "Produce a channel-prioritized marketing plan. Match recommendations realistically to the stated budget — don't recommend expensive channels for a bootstrapped budget.",
    expectedSections: ["Recommended Channels", "Messaging Direction", "First 30 Days"],
  },
  {
    slug: "swot-analysis",
    name: "SWOT Analysis",
    description: "Strengths, weaknesses, opportunities and threats for your business.",
    fields: [
      { key: "description", label: "Describe your business", type: "textarea", required: true },
      { key: "industry", label: "Industry", type: "text", required: true },
      { key: "challenge", label: "Main challenge right now (optional)", type: "textarea" },
    ],
    promptFocus: "Produce a SWOT analysis. Each item must be specific to what was described, not generic startup SWOT filler.",
    expectedSections: ["Strengths", "Weaknesses", "Opportunities", "Threats"],
  },
  {
    slug: "social-media-content-generator",
    name: "Social Media Content Generator",
    description: "Caption ideas for a specific platform and goal.",
    fields: [
      { key: "description", label: "Describe your business", type: "textarea", required: true },
      { key: "platform", label: "Platform", type: "select", options: ["Instagram", "TikTok", "LinkedIn", "Twitter / X", "Facebook"], required: true },
      { key: "goal", label: "Content goal", type: "select", options: ["Brand awareness", "Engagement", "Drive sales", "Educate audience"], required: true },
      { key: "topic", label: "Topic or theme for this post", type: "text", required: true },
    ],
    promptFocus: "Produce 3 distinct caption options suited to the platform's tone, plus relevant hashtags. Match tone and length conventions to the platform specified.",
    expectedSections: ["Caption Options", "Hashtags"],
  },
  {
    slug: "business-proposal-generator",
    name: "Business Proposal Generator",
    description: "A structured proposal outline for a client or partner.",
    fields: [
      { key: "description", label: "Describe your service/offer", type: "textarea", required: true },
      { key: "client", label: "Who is this proposal for?", type: "textarea", required: true },
      { key: "problem", label: "What problem does this solve for them?", type: "textarea", required: true },
      { key: "scope", label: "Scope / pricing (if known)", type: "textarea" },
    ],
    promptFocus: "Produce a structured proposal outline that could be pasted into a real proposal document, specific to the details given.",
    expectedSections: ["Opening Summary", "Approach & What's Included", "Next Steps"],
  },
  {
    slug: "business-idea-analyzer",
    name: "Business Idea Analyzer",
    description: "A candid read on your business idea's viability.",
    fields: [
      { key: "idea", label: "Describe your business idea", type: "textarea", required: true },
      { key: "market", label: "Who is the target market?", type: "textarea", required: true },
      { key: "industry", label: "Industry", type: "text", required: true },
    ],
    promptFocus: "Give a candid analysis — honest about real risks, do not just validate every idea positively. Never claim guaranteed success or failure.",
    expectedSections: ["Viability Assessment", "Key Risks", "What Would Need To Be True"],
  },
];

export function getToolBySlug(slug: string): AITool | undefined {
  return aiTools.find((tool) => tool.slug === slug);
}
