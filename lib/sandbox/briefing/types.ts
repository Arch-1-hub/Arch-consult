export interface NewsItem {
  title: string;
  url: string;
  /** ISO date, or null when the feed gave none. */
  publishedAt: string | null;
  summary: string;
  source: string;
}

export interface FeedConfig {
  id: string;
  name: string;
  url: string;
}

export interface FeedStatus {
  id: string;
  ok: boolean;
  count: number;
  error?: string;
}

export type Impact = "high" | "medium" | "low";

export interface BriefingItem {
  title: string;
  whatChanged: string;
  whatToExpect: string;
  impact: Impact;
  suggestedAction: string;
  sourceUrls: string[];
}

export interface Briefing {
  headline: string;
  summary: string;
  items: BriefingItem[];
  seasonNotes: { title: string; when: string; note: string }[];
  watchNext: string[];
}

export type BriefingStatus = "draft" | "approved" | "rejected" | "sent";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
