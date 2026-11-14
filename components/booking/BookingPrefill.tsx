"use client";

import { useEffect } from "react";

interface Props {
  goals?: string;
  businessName?: string;
  email?: string;
}

/**
 * Fills empty booking fields by name, once, after the page loads. It never overwrites
 * something the person already typed, and it does nothing if a field is missing.
 */
export default function BookingPrefill({ goals, businessName, email }: Props) {
  useEffect(() => {
    const set = (name: string, value?: string) => {
      if (!value) return;
      const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
      if (!el || el.value.trim()) return;
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(el, value);
      else el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };
    set("goals", goals);
    set("businessName", businessName);
    set("email", email);
    const g = document.querySelector<HTMLTextAreaElement>('[name="goals"]');
    if (g && goals) g.rows = Math.max(g.rows || 0, 10);
  }, [goals, businessName, email]);
  return null;
}
