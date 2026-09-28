"use client";

import { useState } from "react";

type Row = {
  slug: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  highlighted: boolean;
  amount_ngn: number | string | null;
  is_placeholder: boolean;
};

const input =
  "mt-1 w-full rounded-md border border-ink-line bg-ink p-3 text-sm text-paper-white focus:outline-none focus:ring-2 focus:ring-gold";

export default function PricingEditor({ initial }: { initial: any[] }) {
  const [rows, setRows] = useState<(Row & { amountText: string })[]>(
    initial.map((r) => ({
      ...r,
      features: Array.isArray(r.features) ? r.features : [],
      amountText: r.amount_ngn ? String(Number(r.amount_ngn)) : "",
    }))
  );
  const [msg, setMsg] = useState<Record<string, string>>({});

  const update = (slug: string, patch: object) =>
    setRows((rs) => rs.map((r) => (r.slug === slug ? { ...r, ...patch } : r)));

  async function save(r: Row & { amountText: string }) {
    setMsg((m) => ({ ...m, [r.slug]: "Saving…" }));
    const amount = r.amountText.trim() === "" ? null : Number(r.amountText);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: r.slug,
          name: r.name,
          price: r.price,
          cadence: r.cadence,
          description: r.description,
          features: r.features,
          highlighted: r.highlighted,
          amount_ngn: amount,
          is_placeholder: r.is_placeholder,
        }),
      });
      const body = await res.json().catch(() => ({}));
      setMsg((m) => ({
        ...m,
        [r.slug]: res.ok ? "Saved" : body.error || "Could not save",
      }));
    } catch {
      setMsg((m) => ({ ...m, [r.slug]: "Could not save — check connection" }));
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ash">
        Changes appear on the public Pricing page straight away. A package with
        a <span className="text-gold">Charge amount</span> gets a working Pay
        button. Leave it empty to show &ldquo;Get Started&rdquo; instead.
      </p>

      {rows.map((r) => {
        const live = r.amountText.trim() !== "" && Number(r.amountText) > 0;
        return (
          <div
            key={r.slug}
            className="rounded-xl border border-ink-line bg-ink-soft p-5"
          >
            <p className="text-xs uppercase tracking-wide2 text-gold">
              {r.slug}
            </p>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-ash">
                Package name
                <input
                  className={input}
                  value={r.name}
                  maxLength={80}
                  onChange={(e) => update(r.slug, { name: e.target.value })}
                />
              </label>
              <label className="text-xs text-ash">
                Price label shown on the card
                <input
                  className={input}
                  value={r.price}
                  maxLength={40}
                  onChange={(e) => update(r.slug, { price: e.target.value })}
                />
              </label>
              <label className="text-xs text-ash">
                Cadence (e.g. one-time)
                <input
                  className={input}
                  value={r.cadence}
                  maxLength={40}
                  onChange={(e) => update(r.slug, { cadence: e.target.value })}
                />
              </label>
              <label className="text-xs text-ash">
                Charge amount in ₦ (empty = no Pay button)
                <input
                  className={input}
                  inputMode="numeric"
                  value={r.amountText}
                  onChange={(e) =>
                    update(r.slug, {
                      amountText: e.target.value.replace(/[^0-9]/g, ""),
                    })
                  }
                />
              </label>
            </div>

            <label className="mt-4 block text-xs text-ash">
              Description
              <textarea
                className={input}
                rows={2}
                maxLength={500}
                value={r.description}
                onChange={(e) => update(r.slug, { description: e.target.value })}
              />
            </label>

            <label className="mt-4 block text-xs text-ash">
              Features (one per line)
              <textarea
                className={input}
                rows={5}
                value={r.features.join("\n")}
                onChange={(e) =>
                  update(r.slug, { features: e.target.value.split("\n") })
                }
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-6 text-sm text-paper-white">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={r.highlighted}
                  onChange={(e) =>
                    update(r.slug, { highlighted: e.target.checked })
                  }
                />
                Mark as &ldquo;Most Popular&rdquo;
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={r.is_placeholder}
                  onChange={(e) =>
                    update(r.slug, { is_placeholder: e.target.checked })
                  }
                />
                Still placeholder pricing
              </label>
            </div>

            {live && (
              <p className="mt-4 rounded-md border border-gold/40 p-3 text-xs text-gold">
                Pay button is LIVE for this package at ₦
                {Number(r.amountText).toLocaleString("en-NG")}. Customers can be
                charged this amount.
                {r.is_placeholder &&
                  " Warning: it is still marked as placeholder pricing."}
              </p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => save(r)}
                className="rounded-md border border-gold px-4 py-2 text-sm text-gold transition-colors hover:bg-gold hover:text-ink"
              >
                Save {r.name}
              </button>
              <span role="status" className="text-xs text-ash">
                {msg[r.slug]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
