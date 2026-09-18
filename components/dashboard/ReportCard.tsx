"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Trash2, Loader2 } from "lucide-react";
import ReportDataViewer from "./ReportDataViewer";

const typeLabels: Record<string, string> = {
  health_check: "Business Health Check",
  launch_plan: "Business Launch Plan",
  ai_consultation: "AI Consultation",
};

export default function ReportCard({
  report,
}: {
  report: { id: string; type: string; title: string; data: Record<string, unknown>; created_at: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this report? This can't be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/reports/${report.id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      setDeleting(false);
    }
  }

  return (
    <div className="border border-ink-line">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <div>
          <span className="text-xs text-gold">{typeLabels[report.type] || report.type}</span>
          <h3 className="mt-1 text-sm text-paper-white">{report.title}</h3>
          <p className="mt-1 text-xs text-ash">
            {new Date(report.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete report"
            className="text-ash hover:text-red-300"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
          <ChevronDown
            size={16}
            className={`text-ash transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {open && (
        <div className="border-t border-ink-line p-5">
          <ReportDataViewer data={report.data} />
        </div>
      )}
    </div>
  );
}
