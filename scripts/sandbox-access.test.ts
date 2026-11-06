import { decideAccess, escapeLike, isAllowlisted, isUuid, pageAccess, FREE_SIMULATIONS, PAID_SIMULATIONS_PER_DAY, ENTITLING_ITEM_TYPES } from "../lib/sandbox/entitlement";

let failed = 0;
function t(name: string, fn: () => void) { try { fn(); console.log("PASS " + name); } catch (e) { failed++; console.log("FAIL " + name + ": " + (e as Error).message); } }
function ok(c: boolean, m: string) { if (!c) throw new Error(m); }

t("one free simulation", () => ok(FREE_SIMULATIONS === 1, "free count"));
t("packages unlock the sandbox", () => ok(ENTITLING_ITEM_TYPES.includes("package"), "package"));
t("anonymous visitor sees the sign-in gate", () => ok(pageAccess({ signedIn: false, verified: false, paid: false, freeUsed: false }).kind === "anon", "anon"));
t("unverified email is blocked even if paid", () => ok(pageAccess({ signedIn: true, verified: false, paid: true, freeUsed: false }).kind === "unverified", "unverified"));
t("verified, unused free run is ready on the free plan", () => { const a = pageAccess({ signedIn: true, verified: true, paid: false, freeUsed: false }); ok(a.kind === "ready" && a.plan === "free", "free"); });
t("verified, free used, not paid -> upgrade", () => ok(pageAccess({ signedIn: true, verified: true, paid: false, freeUsed: true }).kind === "upgrade", "upgrade"));
t("paid is ready on the paid plan even after free used", () => { const a = pageAccess({ signedIn: true, verified: true, paid: true, freeUsed: true }); ok(a.kind === "ready" && a.plan === "paid", "paid"); });
t("decide: free user with unused run is allowed", () => { const d = decideAccess({ paid: false, freeUsed: false, simsLast24h: 0 }); ok(d.allowed && d.plan === "free", "free ok"); });
t("decide: free user who used the run is told to upgrade", () => { const d = decideAccess({ paid: false, freeUsed: true, simsLast24h: 1 }); ok(!d.allowed && d.code === "upgrade", "upgrade"); });
t("decide: paid user is allowed", () => { const d = decideAccess({ paid: true, freeUsed: true, simsLast24h: 3 }); ok(d.allowed && d.plan === "paid", "paid ok"); });
t("decide: paid user hits the daily cap", () => { const d = decideAccess({ paid: true, freeUsed: true, simsLast24h: PAID_SIMULATIONS_PER_DAY }); ok(!d.allowed && d.code === "daily-cap", "cap"); });
t("escapeLike protects underscores and percent signs", () => ok(escapeLike("a_b%c@x.com") === "a\\_b\\%c@x.com", escapeLike("a_b%c@x.com")));
t("allowlist matches case-insensitively and ignores blanks", () => { ok(isAllowlisted("Owner@X.com", " owner@x.com, ,b@y.com"), "match"); ok(!isAllowlisted("c@z.com", "owner@x.com"), "no match"); ok(!isAllowlisted("a@b.com", undefined), "undefined"); });
t("uuid check", () => { ok(isUuid("123e4567-e89b-12d3-a456-426614174000"), "valid"); ok(!isUuid("abc"), "short"); ok(!isUuid(5), "number"); });
console.log(failed ? `${failed} FAILED` : "ALL PASSED");
process.exit(failed ? 1 : 0);
