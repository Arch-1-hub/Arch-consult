import { FeedConfig } from "./types";

/**
 * Where the monthly briefing gets its news. Edit this list to add or remove sources.
 * A feed that fails is skipped and shown as failed on the admin page, so one broken feed
 * never stops a briefing. These addresses follow each site's usual feed pattern and must
 * be confirmed on the live site (the admin page shows which ones answered).
 */
export const NEWS_FEEDS: FeedConfig[] = [
  { id: "businessday", name: "BusinessDay", url: "https://businessday.ng/feed/" },
  { id: "nairametrics", name: "Nairametrics", url: "https://nairametrics.com/feed/" },
  { id: "punch-business", name: "Punch (Business)", url: "https://punchng.com/topics/business/feed/" },
  { id: "premiumtimes-business", name: "Premium Times (Business)", url: "https://www.premiumtimesng.com/category/business/feed" },
  { id: "guardian-ng", name: "The Guardian Nigeria", url: "https://guardian.ng/feed/" },
  { id: "techpoint", name: "Techpoint Africa", url: "https://techpoint.africa/feed/" },
];

/** Items older than this are ignored. */
export const MAX_NEWS_AGE_DAYS = 35;
