"use client";

import Button from "@/components/ui/Button";
import { PageAccess } from "@/lib/sandbox/entitlement";

/** Shown instead of the form when the visitor cannot run a simulation yet. */
export default function AccessGate({ access }: { access: PageAccess }) {
  let heading = "";
  let body = "";
  let actions: { href: string; label: string; primary?: boolean }[] = [];

  switch (access.kind) {
    case "anon":
      heading = "Sign in to run your simulation";
      body =
        "Your first simulation is free. We ask you to sign in with a verified email so every business owner gets a fair run and your results stay tied to you.";
      actions = [
        { href: "/login?redirectTo=/sandbox", label: "Sign in", primary: true },
        { href: "/register", label: "Create an account" },
      ];
      break;
    case "unverified":
      heading = "Verify your email to continue";
      body = `We sent a confirmation link to ${access.email ?? "your email"}. Open it, then come back to this page and refresh. Check your spam folder if you cannot find it.`;
      actions = [];
      break;
    case "upgrade":
      heading = "You have used your free simulation";
      body =
        "Pick a consultation package to unlock the sandbox. Starter and every higher package include unlimited simulations, the Scenario Lab and the AI advisor.";
      actions = [{ href: "/pricing", label: "See packages", primary: true }];
      break;
    default:
      heading = "The sandbox is being set up";
      body = "We are finishing a few things behind the scenes. Please check back shortly.";
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 border border-ink-line bg-ink-soft p-8">
      <h2 className="font-display text-2xl text-paper-white">{heading}</h2>
      <p className="text-sm leading-relaxed text-ash">{body}</p>
      {actions.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          {actions.map((a) =>
            a.primary ? (
              <Button key={a.href} href={a.href} variant="primary" showArrow>
                {a.label}
              </Button>
            ) : (
              <Button key={a.href} href={a.href} variant="outline-dark">
                {a.label}
              </Button>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
