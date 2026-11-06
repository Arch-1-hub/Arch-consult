import { NewsItem } from "./types";

/** Words that matter to nearly every Nigerian business. */
const MACRO = [
  "naira", "exchange rate", "inflation", "interest rate", "cbn", "central bank", "tax", "vat", "customs", "import duty",
  "tariff", "fuel", "petrol", "diesel", "electricity", "power", "nerc", "minimum wage", "strike", "flood", "nema",
  "emergency", "lockdown", "curfew", "security", "border", "cost of living", "subsidy", "levy", "nrs", "firs", "pension",
  "sme", "small business", "msme", "loan", "grant", "regulation", "policy", "ban",
];

/** Extra words for each kind of business, keyed by the sandbox business type. */
const NICHE: Record<string, string[]> = {
  "food-production": ["flour", "wheat", "sugar", "bread", "baker", "cooking oil", "egg", "nafdac", "food price", "packaging", "grain", "maize", "rice"],
  "retail-shop": ["retail", "provision", "wholesale", "market", "food price", "rice", "beans", "garri", "import", "consumer", "supply", "pos", "cash"],
  restaurant: ["restaurant", "food price", "rice", "chicken", "tomato", "pepper", "cooking gas", "lpg", "vegetable oil", "catering", "nafdac", "food vendor"],
  "beauty-salon": ["salon", "beauty", "cosmetic", "hair", "skincare", "nafdac", "import", "wig", "barber", "fashion"],
  "online-store": ["e-commerce", "ecommerce", "online", "delivery", "logistics", "courier", "dispatch", "payment", "fintech", "pos", "data", "internet", "import"],
  "professional-services": ["consult", "legal", "accounting", "audit", "professional", "corporate", "registration", "cac", "compliance", "freelance", "remote work"],
  custom: [],
};

function text(i: NewsItem): string {
  return `${i.title} ${i.summary}`.toLowerCase();
}

function hits(haystack: string, words: string[]): number {
  let n = 0;
  for (const w of words) if (haystack.includes(w)) n++;
  return n;
}

/**
 * Picks the news most useful for one business type and, optionally, one state.
 * An item must match at least one macro or business-type word to be kept.
 */
export function selectItems(items: NewsItem[], niche: string, state: string | null, max: number): NewsItem[] {
  const nicheWords = NICHE[niche] ?? [];
  const stateWord = state ? state.toLowerCase().replace(/\s*\(.*\)\s*$/, "").trim() : "";
  const scored = items
    .map((i) => {
      const t = text(i);
      const macro = hits(t, MACRO);
      const nicheScore = hits(t, nicheWords) * 2;
      const stateScore = stateWord && t.includes(stateWord) ? 3 : 0;
      return { i, score: macro + nicheScore + stateScore, relevant: macro + nicheScore + stateScore > 0 };
    })
    .filter((s) => s.relevant);
  scored.sort((a, b) => b.score - a.score || (Date.parse(b.i.publishedAt ?? "") || 0) - (Date.parse(a.i.publishedAt ?? "") || 0));
  return scored.slice(0, max).map((s) => s.i);
}
