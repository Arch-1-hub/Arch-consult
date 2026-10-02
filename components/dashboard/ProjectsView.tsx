import { STATUS_LABEL, STATUS_COLOR, type Milestone } from "@/lib/projects";
import { Check, Circle } from "lucide-react";

type Project = {
  id: string;
  title: string;
  status: string;
  progress_percent: number;
  summary: string | null;
  milestones: Milestone[];
};

export default function ProjectsView({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return <p className="text-ash">No active projects yet. They'll appear here once one starts.</p>;
  }

  return (
    <div className="space-y-6">
      {projects.map((p) => (
        <div key={p.id} className="rounded-xl border border-ink-line bg-ink-soft p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg text-paper-white">{p.title}</h2>
            <span className={`text-sm ${STATUS_COLOR[p.status]}`}>{STATUS_LABEL[p.status]}</span>
          </div>

          {p.summary && <p className="mt-2 text-sm text-ash">{p.summary}</p>}

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-ash">
              <span>Progress</span>
              <span>{p.progress_percent}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink">
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: `${p.progress_percent}%` }}
              />
            </div>
          </div>

          {p.milestones.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {p.milestones.map((m, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {m.done ? (
                    <Check size={16} className="shrink-0 text-gold" />
                  ) : (
                    <Circle size={16} className="shrink-0 text-ash" />
                  )}
                  <span className={m.done ? "text-ash line-through" : "text-paper-white"}>
                    {m.title}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
