import type { ScoredOption } from "@/components/shared/WizardFields";

export const businessStages = [
  "Just an idea, not yet trading",
  "Early stage — first customers",
  "Established — steady revenue",
  "Scaling — growing fast",
];

export const scoredQuestions: {
  key: string;
  category: string;
  label: string;
  options: ScoredOption[];
}[] = [
  {
    key: "branding",
    category: "Branding",
    label: "How would you describe your current brand identity?",
    options: [
      { label: "No consistent identity yet", score: 20 },
      { label: "Basic logo, no real system", score: 45 },
      { label: "Consistent visuals, unclear positioning", score: 70 },
      { label: "Strong, consistent identity and positioning", score: 95 },
    ],
  },
  {
    key: "marketing",
    category: "Marketing",
    label: "How would you describe your current marketing efforts?",
    options: [
      { label: "Little to no active marketing", score: 15 },
      { label: "Occasional, inconsistent posting", score: 40 },
      { label: "Regular activity, no clear measurement", score: 65 },
      { label: "Consistent activity with measurable results", score: 95 },
    ],
  },
  {
    key: "positioning",
    category: "Positioning",
    label: "How clearly can you describe what makes your business different from competitors?",
    options: [
      { label: "Not sure how we're different", score: 15 },
      { label: "Have an idea, haven't articulated it clearly", score: 45 },
      { label: "Can explain it, but customers may not notice", score: 70 },
      { label: "Clear and customers recognize the difference", score: 95 },
    ],
  },
  {
    key: "acquisition",
    category: "Customer Acquisition",
    label: "How do you currently get new customers?",
    options: [
      { label: "Mostly word of mouth, unpredictable", score: 20 },
      { label: "One channel, inconsistent results", score: 45 },
      { label: "A few channels, some tracking", score: 70 },
      { label: "Multiple reliable channels, tracked and optimized", score: 95 },
    ],
  },
  {
    key: "digital",
    category: "Digital Presence",
    label: "Which best describes your online presence?",
    options: [
      { label: "No real online presence", score: 15 },
      { label: "Just a social media page", score: 40 },
      { label: "Website plus social, not well maintained", score: 65 },
      { label: "Strong, well-maintained website and social presence", score: 95 },
    ],
  },
  {
    key: "operations",
    category: "Operations",
    label: "How would you describe your day-to-day operations?",
    options: [
      { label: "Chaotic, mostly reactive", score: 20 },
      { label: "Some processes, a lot still in my head", score: 45 },
      { label: "Documented processes for most things", score: 70 },
      { label: "Well-documented, delegated, runs without me daily", score: 95 },
    ],
  },
  {
    key: "growth",
    category: "Growth Readiness",
    label: "How prepared do you feel to scale in the next 12 months?",
    options: [
      { label: "Not prepared — still finding footing", score: 20 },
      { label: "Somewhat prepared, big gaps remain", score: 45 },
      { label: "Mostly prepared, a few things to fix", score: 70 },
      { label: "Well prepared with a clear plan", score: 95 },
    ],
  },
];

export function computeScores(answers: Record<string, string>) {
  const categoryScores: Record<string, number> = {};
  for (const q of scoredQuestions) {
    const selected = q.options.find((o) => o.label === answers[q.key]);
    categoryScores[q.category] = selected ? selected.score : 0;
  }
  const overall = Math.round(
    Object.values(categoryScores).reduce((a, b) => a + b, 0) /
      Object.values(categoryScores).length
  );
  return { categoryScores, overall };
}
